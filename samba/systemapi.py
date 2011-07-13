# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus.service
import socket
from threading import Lock

from django.conf import settings
from django.template.loader import render_to_string

from systemd       import logged, invoke
from samba.models  import Share
from samba.conf    import settings as samba_settings

@logged
class SystemD(dbus.service.Object):
    dbus_path = "/samba"

    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        self.lock    = Lock()
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( samba_settings.SMB_CONF, "wb" )
            try:
                fd.write( render_to_string( "samba/smb.conf", {
                    'Hostname':  socket.gethostname(),
                    'Domain':    samba_settings.DOMAIN,
                    'Workgroup': samba_settings.WORKGROUP,
                    'Shares':    Share.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update")
                    } ) )
            finally:
                fd.close()

            return invoke([samba_settings.INITSCRIPT, "reload"])
        finally:
            self.lock.release()
