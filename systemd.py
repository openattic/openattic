# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import traceback

from os.path import dirname, abspath
from optparse import OptionParser

import gobject
import dbus
import dbus.service
import dbus.types
import dbus.mainloop.glib

PROJECT_ROOT = None

# Path auto-detection
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(abspath(__file__))

# environment variables
sys.path.append( PROJECT_ROOT )
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from django.conf import settings

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


class SystemD(dbus.service.Object):
    def __init__(self):
        self.bus = dbus.SystemBus()
        dbus.service.Object.__init__(self, self.bus, "/")
        self.busname = dbus.service.BusName(settings.DBUS_IFACE_SYSTEMD, self.bus)

        self.modules = {}
        for module in INSTALLERS:
            try:
                daemon = getattr( getattr( module, "systemd" ), "SystemD" )
                self.modules[ module.__name__ ] = daemon(self.bus, self.busname)
            except:
                traceback.print_exc()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_detected_modules(self):
        return [module.__name__ for module in INSTALLERS]

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_loaded_modules(self):
        return self.modules.keys()


if __name__ == '__main__':
    parser = OptionParser()

    parser.add_option( "-l", "--logfile",
        help="Redirect stdout and stderr to a logfile.",
        default=None
        )

    options, args = parser.parse_args()

    if options.logfile:
        sys.stdout = open( options.logfile, "wb", False )
        sys.stderr = sys.stdout

    print "Running."
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    loop = gobject.MainLoop()
    master = SystemD()
    loop.run()
