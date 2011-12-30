# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.template.loader import render_to_string

from systemd       import invoke, logged, LockingPlugin, method

from tftp.conf     import settings as tftp_settings
from tftp.models   import Instance

@logged
class SystemD(LockingPlugin):
    dbus_path = "/tftp"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( tftp_settings.XINETD_CONF, "wb" )
            try:
                fd.write( render_to_string( "tftp/xinetd.conf", {
                    'Instances': Instance.objects.all(),
                    } ) )
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def reload(self):
        return invoke(["/etc/init.d/xinetd", "reload"])
