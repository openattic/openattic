# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import traceback

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

class Command( BaseCommand ):
    help = "Daemon that executes all commands for which root is needed."
    option_list = BaseCommand.option_list + (
        make_option( "-l", "--logfile",
        help="Redirect stdout and stderr to a logfile.",
        default=None
        ),
    )

    def handle(self, **options):
        if os.getuid() != 0:
            raise SystemError( "I need to run as root." )

        if 'logfile' in options and options['logfile']:
            sys.stdout = open( options['logfile'], "wb", False )
            sys.stderr = sys.stdout

        os.environ["LANG"] = "en_US.UTF-8"

        print "Detecting modules...",
        INSTALLERS = []
        for app in settings.INSTALLED_APPS:
            try:
                module = __import__( app+".systemd" )
            except ImportError, err:
                if unicode(err) != "No module named systemd":
                    print >> sys.stdout, app, unicode(err)
            else:
                INSTALLERS.append(module)
                print module.__name__,
        print

        print "Running."
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        loop = gobject.MainLoop()
        master = SystemD(INSTALLERS)
        loop.run()
