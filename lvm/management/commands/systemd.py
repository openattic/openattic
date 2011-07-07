# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import traceback
import logging

from logging.handlers import SysLogHandler
from functools import wraps
from os.path import dirname, abspath
from optparse import make_option

import gobject
import dbus
import dbus.service
import dbus.types
import dbus.mainloop.glib

from django.core.management.base import BaseCommand
from django.conf import settings

from lvm.systemd import makeloggedfunc

class SystemD(dbus.service.Object):
    def __init__(self, detected_modules):
        self.bus = dbus.SystemBus()
        dbus.service.Object.__init__(self, self.bus, "/")
        self.busname = dbus.service.BusName(settings.DBUS_IFACE_SYSTEMD, self.bus)

        self.modules = {}
        for module in detected_modules:
            try:
                daemon = getattr( getattr( module, "systemd" ), "SystemD" )
                self.modules[ module.__name__ ] = daemon(self.bus, self.busname)
            except:
                traceback.print_exc()

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_detected_modules(self):
        return [module.__name__ for module in INSTALLERS]

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_loaded_modules(self):
        return self.modules.keys()

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="s")
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
        rootlogger.name = "openattic_systemd"
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
        INSTALLERS = []
        for app in settings.INSTALLED_APPS:
            try:
                module = __import__( app+".systemd" )
            except ImportError, err:
                if unicode(err) != "No module named systemd":
                    logging.error("Got error when checking app %s: %s", app, unicode(err))
            else:
                INSTALLERS.append(module)
        logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in INSTALLERS]) )

        logging.info( "Running." )
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        loop = gobject.MainLoop()
        master = SystemD(INSTALLERS)
        loop.run()
