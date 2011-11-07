# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.template.loader import render_to_string

from systemd       import logged, invoke, LockingPlugin, method
from pamauth       import PamBackend
from samba.models  import Share
from samba.conf    import settings as samba_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/samba"

    @method(in_signature="", out_signature="")
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
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def reload(self):
        return invoke([samba_settings.INITSCRIPT, "reload"])

    @method(in_signature="ss", out_signature="i")
    def setpasswd(self, username, passwd):
        return invoke(["smbpasswd", "-as", username], log=False, stdin=("%s\n%s\n" % (passwd, passwd)))

    setpasswd._enable_logging = False
