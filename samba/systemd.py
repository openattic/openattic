# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service

from django.conf import settings
from django.template.loader import render_to_string

from lvm.procutils import invoke
from samba.models  import Share
from samba.conf    import settings as samba_settings

class SystemD(dbus.service.Object):
    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, "/samba")

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def writeconf(self):
        fd = open( samba_settings.SMB_CONF, "wb" )
        fd.write( render_to_string( "samba/smb.conf", {
            'Hostname':  socket.gethostname(),
            'Domain':    samba_settings.DOMAIN,
            'Workgroup': samba_settings.WORKGROUP,
            'Shares':    Share.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update")
            } ) )
        fd.close()

        return invoke([samba_settings.INITSCRIPT, "reload"])
