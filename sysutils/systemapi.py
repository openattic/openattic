# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os.path
import ctypes

from systemd import invoke, logged, LockingPlugin, method
from sysutils.models import NTP
@logged
class SystemD(LockingPlugin):
    dbus_path = "/sysutils"

    @method(in_signature="", out_signature="i")
    def shutdown(self):
        return invoke(["init", "0"])

    @method(in_signature="", out_signature="i")
    def reboot(self):
        return invoke(["init", "6"])

    @method(in_signature="ss", out_signature="i")
    def run_initscript(self, sname, command):
        spath = os.path.join( "/etc/init.d", sname )
        if not os.path.exists(spath):
            raise ValueError("No such file or directory: '%s'" % spath)
        return invoke([spath, command], log=( command != "status" ), fail_on_err=False)

    @method(in_signature="i", out_signature="i")
    def set_time(self, seconds):
        librt = ctypes.cdll.LoadLibrary("librt.so")

        class timespec(ctypes.Structure):
            _fields_ = [
                ('tv_sec', ctypes.c_long),
                ('tv_nsec', ctypes.c_long)]

        timeobj = timespec(int(seconds), 0)
        return librt.clock_settime( 0, ctypes.pointer(timeobj) )

    @method(in_signature="", out_signature="")
    def write_ntp(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/ntp.conf", "wb" )
            try:
                    ntp = NTP.objects.all()[0]
                    fd.write( "server=%s\n" % ntp.server )
            finally:      
                fd.close()    
        finally:
            self.lock.release()

