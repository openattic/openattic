# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import os
import sys
import traceback
import logging
import inspect
import SocketServer
import socket
import xmlrpclib

from SimpleXMLRPCServer import list_public_methods, SimpleXMLRPCServer
from SimpleXMLRPCServer import SimpleXMLRPCRequestHandler, SimpleXMLRPCDispatcher
from BaseHTTPServer import HTTPServer
from SocketServer import ThreadingMixIn
from logging.handlers import SysLogHandler
from optparse import make_option
from base64   import b64decode
from M2Crypto import SSL

from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from django.db import models
from django.conf import settings

from rpcd.models   import APIKey
from rpcd.handlers import ModelHandler
from utilities import get_django_app_modules


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass

class ThreadingXMLRPCServer(ThreadingMixIn, SimpleXMLRPCServer):
    def shutdown_request(self, request):
        from django.db import close_old_connections
        # Close the database connection after every request because keeping it open
        # would result in lots of "<IDLE> in transaction" postgresql processes hogging
        # the max_connection_limit and thereby breaking pretty much everything else.
        close_old_connections()
        return SimpleXMLRPCServer.shutdown_request(self, request)

class SecureXMLRPCServer(ThreadingHTTPServer, SimpleXMLRPCDispatcher):
    """ Secure XML-RPC server.

        It it very similar to SimpleXMLRPCServer but it uses HTTPS for transporting XML data.

        See http://www.cs.technion.ac.il/~danken/SecureXMLRPCServer.py
    """
    def __init__(self, server_address, keyFile, certFile,
                allow_none=False, encoding=None, logRequests=False, requestHandler=SimpleXMLRPCRequestHandler):
        self.logRequests = logRequests

        SimpleXMLRPCDispatcher.__init__(self, allow_none, encoding)

        ThreadingHTTPServer.__init__(self, server_address, requestHandler)
        ctx = SSL.Context('sslv3')

        ctx.load_cert_chain(certFile, keyFile)
        ctx.set_session_id_ctx ('vdsm-ssl')
        self.socket = SSL.Connection(ctx, socket.socket(self.address_family, self.socket_type))
        self.server_bind()
        self.server_activate()

    def get_request(self):
        try:
            return ThreadingHTTPServer.get_request(self)
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
        except Exception, e:
            # This should only happen if the module is buggy
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

        This RequestHandler also stores the user and passes it on to _dispatch.
    """
    def parse_request(self):
        # first, call the original implementation which returns
        # True if all OK so far
        self.current_user = None
        if SimpleXMLRPCRequestHandler.parse_request(self):
            # next we authenticate
            header = self.headers.get('Authorization')
            if header is not None:
                method, encoded = header.split(' ', 1)
                if method.lower() == "basic":
                    username, password = b64decode(encoded).split(':', 1)
                    if username == '__':
                        try:
                            key = APIKey.objects.get(apikey=password, active=True)
                        except APIKey.DoesNotExist:
                            self.send_response(401, 'Authentication failed')
                            self.send_header("WWW-Authenticate", 'Basic realm="openATTIC XMLRPC"')
                            self.end_headers()
                            return False
                        else:
                            self.current_user = key.owner
                            return True
                    else:
                        user = authenticate(username=username, password=password)
                        if user is not None and user.is_active:
                            self.current_user = user
                            return True
            # if authentication fails, tell the client
            self.send_response(401, 'Authentication failed')
            self.send_header("WWW-Authenticate", 'Basic realm="openATTIC XMLRPC"')
            self.end_headers()
        return False

    def _dispatch(self, method, params):
        if method in self.server.funcs:
            # the system.* namespace is listed in funcs, those don't understand the user param
            return self.server.funcs[method]( *params )
        # pass the user to the instance.
        return self.server.instance._dispatch( method, params, self.current_user )


class ProfilingRequestHandler(VerifyingRequestHandler):
    def _dispatch(self, method, params):
        import cProfile
        from time import time
        prof = cProfile.Profile()
        try:
            return prof.runcall(VerifyingRequestHandler._dispatch, self, method, params)
        finally:
            prof.dump_stats("/tmp/profile_data/%s.%s.profile" % (time(), method))


class RPCd(object):
    def __init__(self, rpcdplugins):
        self.handlers = {}

        for plugin in rpcdplugins:
            for handler in getattr(plugin, "RPCD_HANDLERS", []):
                self.handlers[ handler.handler_name ] = handler

    def _resolve(self, method, user):
        if '.' in method:
            obj, methname = method.rsplit(".", 1)
            # Before calling the method, instantiate the handler and pass the current user to it
            return getattr( self.handlers[obj](user), methname )
        else:
            return getattr( self, method )

    def _dispatch(self, method, params, user):
        try:
            return self._resolve( method, user )( *params )
        except Exception:
            logging.error( traceback.format_exc() )
            # By default, the dispatcher doesn't send traceback information, which makes debugging
            # really hard, so we create the Fault instance ourselves.
            raise xmlrpclib.Fault(1, traceback.format_exc())

    def _methodHelp(self, method):
        doc = self._resolve(method, None).__doc__
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
        res = []
        for hname in self.handlers.keys():
            app = hname.split('.')[0]
            if app not in res:
                res.append(app)
        return res

    def get_function_args(self, method):
        """ Return a list of function argument names. """
        args = inspect.getargspec(self._resolve( method, None )).args
        if args[0] == 'self':
            args = args[1:]
        if args and args[-1] == 'user':
            args = args[:-1]
        return args

    def get_installed_apps(self):
        """ Return a list of installed Django apps. """
        return settings.INSTALLED_APPS

    def ping(self):
        """ Noop to test the XMLRPC connection. """
        return "pong"

    def hostname(self):
        """ Get this host's hostname. """
        return socket.gethostname()

    def fqdn(self):
        """ Get this host's fully qualified domain name (FQDN). """
        return socket.getfqdn()

    def get_object(self, idobj):
        """ Return an object resolved from an ID dictionary. """
        model = models.get_model(idobj["app"], idobj["obj"])
        handler = ModelHandler._get_handler_for_model(model)(None)
        return handler.get(idobj["id"])

    def get_related(self, idobj):
        """ Return objects that reference the object given by the ID dictionary. """
        model = models.get_model(idobj["app"], idobj["obj"])
        if hasattr(model, "all_objects"):
            obj = model.all_objects.get(id=idobj["id"])
        else:
            obj = model.objects.get(id=idobj["id"])
        relids = []
        for relobj in ( obj._meta.get_all_related_objects() + obj._meta.get_all_related_many_to_many_objects() ):
            if hasattr(relobj.model, "all_objects"):
                relmanager = relobj.model.all_objects
            else:
                relmanager = relobj.model.objects
            try:
                relhandler = ModelHandler._get_handler_for_model(relobj.model)(None)
            except KeyError:
                # handler does not exist, return shadow ID
                relids.extend([
                    { "app": relmdl._meta.app_label,
                      "obj": relmdl._meta.object_name,
                      "id":  relmdl.id,
                      "__shadow__": True }
                    for relmdl in relobj.model.objects.filter( **{ relobj.field.name: obj } )
                    ])
            else:
                relids.extend([
                    relhandler._idobj(relmdl)
                    for relmdl in relmanager.filter( **{ relobj.field.name: obj } )
                    ])
        return relids


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
        make_option( "-s", "--sysloglevel",
            help="loglevel with which to log to syslog, defaults to WARNING. OFF disables syslog altogether.",
            default="WARNING"
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
        make_option(       "--profile",
            help="Store profile data in /tmp/profile_data.",
            default=False, action="store_true"
            ),
    )

    def handle(self, **options):
        os.environ["LANG"] = "C"

        if 'logfile' in options and options['logfile']:
            sys.stdout.close()
            sys.stderr.close()
            sys.stdout = open(options['logfile'], "ab", buffering=False)
            sys.stderr = sys.stdout

        rootlogger = logging.getLogger()
        rootlogger.name = "openattic_rpcd"
        rootlogger.setLevel(logging.DEBUG)

        logch = logging.StreamHandler()
        logch.setLevel({2: logging.DEBUG, 1: logging.INFO, 0: logging.WARNING}[int(options['verbosity'])])
        logch.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
        rootlogger.addHandler(logch)

        if 'sysloglevel' in options and options['sysloglevel'].upper() != 'OFF':
            try:
                logsh = SysLogHandler(address="/dev/log")
            except socket.error, err:
                logging.error("Failed to connect to syslog: " + unicode(err))
            else:
                logsh.setLevel( getloglevel(options['sysloglevel']) )
                logsh.setFormatter( logging.Formatter('%(name)s: %(levelname)s %(message)s') )
                rootlogger.addHandler(logsh)

        rpcdplugins = get_django_app_modules('rpcapi')

        if options["profile"]:
            requestHandler = ProfilingRequestHandler
        else:
            requestHandler = VerifyingRequestHandler

        if options["certfile"] and options["keyfile"]:
            logging.info( "Initializing SecureXMLRPCServer (using SSL)" )
            serv = SecureXMLRPCServer((options['bindaddr'], options['bindport']),
                certFile=options["certfile"], keyFile=options["keyfile"],
                allow_none=True, requestHandler=requestHandler)
        else:
            logging.info( "Initializing SimpleXMLRPCServer (not using SSL)" )
            serv = ThreadingXMLRPCServer((options['bindaddr'], options['bindport']),
                allow_none=True, requestHandler=requestHandler)
        serv.register_introspection_functions()
        serv.register_instance(RPCd(rpcdplugins), allow_dotted_names=True)
        serv.serve_forever()
