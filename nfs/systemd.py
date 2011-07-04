# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service

from django.conf import settings

from lvm.procutils import invoke
from nfs.models    import Export
from nfs.conf      import settings as nfs_settings

class SystemD(dbus.service.Object):
    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, "/nfs")

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def writeconf(self):
        fd = open( nfs_settings.EXPORTS, "wb" )
        for export in Export.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update"):
            fd.write( "%-50s %s(%s)\n" % ( export.path, export.address, export.options ) )
        fd.close()

        return invoke(["/usr/sbin/exportfs", "-a"])

