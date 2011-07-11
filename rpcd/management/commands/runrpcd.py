# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import traceback
import logging

from logging.handlers import SysLogHandler
from os.path import dirname, abspath
from optparse import make_option

import dbus

from django.core.management.base import BaseCommand
from django.conf import settings

from lvm.systemd import makeloggedfunc


from SimpleXMLRPCServer import list_public_methods, SimpleXMLRPCServer, SimpleXMLRPCRequestHandler


class RPCd(object):
    def __init__(self, rpcdplugins):
        self.bus = dbus.SystemBus()
        self.handlers = {}

        for plugin in rpcdplugins:
            for handler in getattr(getattr(plugin, "rpcapi"), "RPCD_HANDLERS", []):
                meta = handler.model._meta
                self.handlers[ meta.app_label+'.'+meta.object_name ] = handler()

    def _dispatch(self, method, params):
        obj, methname = method.rsplit(".", 1)
        print obj, methname, params
        return getattr( self.handlers[obj], methname )( *params )

    def _methodHelp(self, method):
        obj, methname = method.rsplit(".", 1)
        print obj, methname
        return getattr( self.handlers[obj], methname ).__doc__

    def _listMethods(self):
        methods = list_public_methods(self)
        for hndname in self.handlers:
            methods.extend([ hndname+'.'+method for method in list_public_methods(self.handlers[hndname]) ])
        return methods

    def get_loaded_modules(self):
        return self.modules.keys()

    def ping(self):
        return "pong"


def getloglevel(levelstr):
    numeric_level = getattr(logging, levelstr.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % levelstr)
    return numeric_level


class Command( BaseCommand ):
    help = "Daemon that executes all commands for which root is needed."
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
    )

    def handle(self, **options):
        if os.getuid() != 0:
            raise SystemError( "I need to run as root." )

        os.environ["LANG"] = "en_US.UTF-8"

        rootlogger = logging.getLogger()
        rootlogger.name = "openattic_rpcd"
        rootlogger.setLevel(logging.DEBUG)

        if not options['quiet']:
            logch = logging.StreamHandler()
            logch.setLevel(logging.DEBUG)
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

        serv = SimpleXMLRPCServer(("0.0.0.0", 55123), allow_none=True)
        serv.register_introspection_functions()
        serv.register_instance(RPCd(rpcdplugins), allow_dotted_names=True)
        serv.serve_forever()
