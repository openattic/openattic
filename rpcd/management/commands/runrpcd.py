# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import traceback
import logging
import inspect
import SocketServer
import socket

from SimpleXMLRPCServer import list_public_methods, SimpleXMLRPCServer
from SimpleXMLRPCServer import SimpleXMLRPCRequestHandler, SimpleXMLRPCDispatcher
from BaseHTTPServer import HTTPServer
from logging.handlers import SysLogHandler
from optparse import make_option
from base64   import b64decode
from M2Crypto import SSL

import dbus

from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from django.conf import settings

from rpcd.handlers import BaseHandler

class SecureXMLRPCServer(HTTPServer, SimpleXMLRPCDispatcher):
    """ Secure XML-RPC server.

        It it very similar to SimpleXMLRPCServer but it uses HTTPS for transporting XML data.

        See http://www.cs.technion.ac.il/~danken/SecureXMLRPCServer.py
    """
    def __init__(self, server_address, keyFile, certFile,
                allow_none=False, encoding=None, logRequests=False, requestHandler=SimpleXMLRPCRequestHandler):
        self.logRequests = logRequests

        SimpleXMLRPCDispatcher.__init__(self, allow_none, encoding)

        SocketServer.BaseServer.__init__(self, server_address, requestHandler)
        ctx = SSL.Context('sslv3')

        ctx.load_cert_chain(certFile, keyFile)
        ctx.set_session_id_ctx ('vdsm-ssl')
        self.socket = SSL.Connection(ctx, socket.socket(self.address_family, self.socket_type))
        self.server_bind()
        self.server_activate()

    def get_request(self):
        try:
            return HTTPServer.get_request(self)
        except SSL.SSLError, e:
            logging.error( "Error accepting connection: " + unicode(e) )
            raise socket.error(unicode(e))

class SecureXMLRPCRequestHandler(SimpleXMLRPCRequestHandler):
    """ Secure XML-RPC request handler class.

        It it very similar to SimpleXMLRPCRequestHandler but it uses HTTPS for transporting XML data.
    """
    def setup(self):
        self.connection = self.request
        self.rfile = socket._fileobject(self.request, "rb", self.rbufsize)
        self.wfile = socket._fileobject(self.request, "wb", self.wbufsize)

    def do_POST(self):
        """ Handles the HTTPS POST request.

            It was copied out from SimpleXMLRPCServer.py and modified to shutdown the socket cleanly.
        """

        # Check that the path is legal
        if not self.is_rpc_path_valid():
            self.report_404()
            return

        try:
            # get arguments
            #data = self.rfile.read(int(self.headers["content-length"]))
            max_chunk_size = 10*1024*1024
            size_remaining = int(self.headers["content-length"])
            L = []
            while size_remaining:
                chunk_size = min(size_remaining, max_chunk_size)
                L.append(self.rfile.read(chunk_size))
                size_remaining -= len(L[-1])
            data = ''.join(L)
            # In previous versions of SimpleXMLRPCServer, _dispatch
            # could be overridden in this class, instead of in
            # SimpleXMLRPCDispatcher. To maintain backwards compatibility,
            # check to see if a subclass implements _dispatch and dispatch
            # using that method if present.
            response = self.server._marshaled_dispatch(
                    data, getattr(self, '_dispatch', None)
                )
        except: # This should only happen if the module is buggy
            # internal error, report as HTTP server error
            self.send_response(500)

            # Send information about the exception if requested
            if hasattr(self.server, '_send_traceback_header') and \
                    self.server._send_traceback_header:
                self.send_header("X-exception", str(e))
                self.send_header("X-traceback", traceback.format_exc())

            self.end_headers()
        else:
            # got a valid XML RPC response
            self.send_response(200)
            self.send_header("Content-type", "text/xml")
            self.send_header("Content-length", str(len(response)))
            self.end_headers()
            self.wfile.write(response)

            # shut down the connection
            self.wfile.flush()
#            self.connection.shutdown(1) # no idea why that causes stuff to fail


class VerifyingRequestHandler(SecureXMLRPCRequestHandler):
    """ RequestHandler that authenticates requests against Django's auth system.

        See http://www.acooke.org/cute/BasicHTTPA0.html
    """
    def parse_request(self):
        # first, call the original implementation which returns
        # True if all OK so far
        if SimpleXMLRPCRequestHandler.parse_request(self):
            # next we authenticate
            header = self.headers.get('Authorization')
            if header is not None:
                method, encoded = header.split(' ', 1)
                if method.lower() == "basic":
                    username, password = b64decode(encoded).split(':', 1)
                    user = authenticate(username=username, password=password)
                    if user is not None and user.is_active:
                        return True
            # if authentication fails, tell the client
            self.send_error(401, 'Authentication failed')
        return False


class RPCd(object):
    def __init__(self, rpcdplugins):
        self.bus = dbus.SystemBus()
        self.handlers = {}

        for plugin in rpcdplugins:
            for handler in getattr(getattr(plugin, "rpcapi"), "RPCD_HANDLERS", []):
                meta = handler.model._meta
                self.handlers[ meta.app_label+'.'+meta.object_name ] = handler()

    def _resolve(self, method):
        if '.' in method:
            obj, methname = method.rsplit(".", 1)
            return getattr( self.handlers[obj], methname )
        else:
            return getattr( self, method )

    def _dispatch(self, method, params):
        return self._resolve( method )( *params )

    def _methodHelp(self, method):
        doc = self._resolve(method).__doc__
        if doc is not None:
            return doc.strip()
        return ""

    def _listMethods(self):
        methods = list_public_methods(self)
        for hndname in self.handlers:
            methods.extend([ hndname+'.'+method
                for method in list_public_methods(self.handlers[hndname])
                if method != "model" ])
        return methods

    def get_loaded_modules(self):
        """ Return a list of loaded handler modules. """
        return self.handlers.keys()

    def ping(self):
        """ Noop to test the connection. """
        return "pong"

    def get_function_args(self, method):
        """ Return a list of function argument names. """
        args = inspect.getargspec(self._resolve( method )).args
        if args[0] == 'self':
            return args[1:]
        return args

    def get_object(self, id):
        """ Return an object resolved from an ID dictionary. """
        obj = BaseHandler._get_object_by_id_dict(id)
        handler = BaseHandler._get_handler_for_model(obj.__class__)()
        return handler._getobj(obj)

def getloglevel(levelstr):
    numeric_level = getattr(logging, levelstr.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % levelstr)
    return numeric_level


class Command( BaseCommand ):
    help = "Daemon that handles communication over XMLRPC."
    option_list = BaseCommand.option_list + (
        make_option( "-l", "--logfile",
            help="Log to a logfile.",
            default=None
            ),
        make_option( "-L", "--loglevel",
            help="loglevel of said logfile, defaults to INFO.",
            default="INFO"
            ),
        make_option( "-s", "--sysloglevel",
            help="loglevel with which to log to syslog, defaults to WARNING. OFF disables syslog altogether.",
            default="WARNING"
            ),
        make_option( "-q", "--quiet",
            help="Don't log to stdout.",
            default=False, action="store_true"
            ),
        make_option( "-b", "--bindaddr",
            help="The IP address to bind to (default: 0.0.0.0).",
            default="0.0.0.0"
            ),
        make_option( "-p", "--bindport",
            help="The port number to bind to (default: 31234).",
            default=31234, type="int"
            ),
        make_option( "-c", "--certfile",
            help="SSL certificate file.",
            default=None
            ),
        make_option( "-k", "--keyfile",
            help="SSL certificate key file.",
            default=None
            ),
    )

    def handle(self, **options):
        os.environ["LANG"] = "en_US.UTF-8"

        rootlogger = logging.getLogger()
        rootlogger.name = "openattic_rpcd"
        rootlogger.setLevel(logging.DEBUG)

        if not options['quiet']:
            logch = logging.StreamHandler()
            logch.setLevel({2: logging.DEBUG, 1: logging.INFO, 0: logging.WARNING}[int(options['verbosity'])])
            logch.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
            rootlogger.addHandler(logch)

        if 'logfile' in options and options['logfile']:
            logfh = logging.FileHandler(options['logfile'])
            logfh.setLevel( getloglevel(options['loglevel']) )
            logfh.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
            rootlogger.addHandler(logfh)

        if 'sysloglevel' in options and options['sysloglevel'].upper() != 'OFF':
            logsh = SysLogHandler(address="/dev/log")
            logsh.setLevel( getloglevel(options['sysloglevel']) )
            logsh.setFormatter( logging.Formatter('%(name)s: %(levelname)s %(message)s') )
            rootlogger.addHandler(logsh)

        logging.info("Detecting modules...")
        rpcdplugins = []
        for app in settings.INSTALLED_APPS:
            try:
                module = __import__( app+".rpcapi" )
            except ImportError, err:
                if unicode(err) != "No module named rpcapi":
                    logging.error("Got error when checking app %s: %s", app, unicode(err))
            else:
                rpcdplugins.append(module)
        logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in rpcdplugins]) )

        if options["certfile"] and options["keyfile"]:
            serv = SecureXMLRPCServer((options['bindaddr'], options['bindport']),
                certFile=options["certfile"], keyFile=options["keyfile"],
                allow_none=True, requestHandler=VerifyingRequestHandler)
        else:
            serv = SimpleXMLRPCServer((options['bindaddr'], options['bindport']),
                allow_none=True, requestHandler=VerifyingRequestHandler)
        serv.register_introspection_functions()
        serv.register_instance(RPCd(rpcdplugins), allow_dotted_names=True)
        serv.serve_forever()
