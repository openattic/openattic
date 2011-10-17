# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
import socket
from systemd       import invoke, logged, LockingPlugin, method
from ssmtp.models  import SSMTP

@logged
class SystemD(LockingPlugin):
    dbus_path = "/ssmtp"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/ssmtp/ssmtp.conf", "wb" )
            try:
                    ssmtp = SSMTP.objects.all()[0]
                    fd.write( "root=%s\n" % ssmtp.root )
                    fd.write( "mailhub=%s\n" % ssmtp.mailhub )
                    fd.write( "rewriteDomain=%s\n" % ssmtp.rewriteDomain )
                    fd.write( "hostname=%s\n" % socket.getfqdn() )
                    fd.write( "FromLineOverride=NO\n" )
            finally:
                fd.close()
        finally:
            self.lock.release()

