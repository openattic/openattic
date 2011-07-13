# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import socket

from django.template.loader import render_to_string

from systemd import invoke, logged, BasePlugin, method
from drbd.models   import DrbdDevice

@logged
class SystemD(BasePlugin):
    dbus_path = "/drbd"

    @method( in_signature="s", out_signature="i")
    def createmd(self, resource):
        return invoke(["/sbin/drbdadm", "create-md", resource], stdin="yes\n")

    @method( in_signature="s", out_signature="i")
    def attach(self, resource):
        return invoke(["/sbin/drbdadm", "attach", resource])

    @method( in_signature="s", out_signature="i")
    def connect(self, resource):
        return invoke(["/sbin/drbdadm", "connect", resource])

    @method( in_signature="s", out_signature="i")
    def up(self, resource):
        return invoke(["/sbin/drbdadm", "up", resource])

    @method( in_signature="s", out_signature="i")
    def primary(self, resource):
        return invoke(["/sbin/drbdadm", "--", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def primary_overwrite(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--overwrite-data-of-peer", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def primary_force(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--force", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def secondary(self, path):
        return invoke(["/sbin/drbdadm", "--", path, "secondary"])

    @method( in_signature="s", out_signature="i")
    def adjust(self, resource):
        return invoke(["/sbin/drbdadm", "adjust", resource])

    @method( in_signature="s", out_signature="i")
    def disconnect(self, resource):
        return invoke(["/sbin/drbdadm", "disconnect", resource])

    @method( in_signature="s", out_signature="i")
    def detach(self, resource):
        return invoke(["/sbin/drbdadm", "detach", resource])

    @method( in_signature="s", out_signature="i")
    def down(self, resource):
        return invoke(["/sbin/drbdadm", "down", resource])

    @method( in_signature="s", out_signature="a{ss}")
    def get_dstate(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "dstate", resource], return_out_err=True)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="s", out_signature="s")
    def get_cstate(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "cstate", resource], return_out_err=True)
        return out.strip()

    @method( in_signature="s", out_signature="a{ss}")
    def get_role(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "role", resource], return_out_err=True)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="i", out_signature="")
    def conf_write(self, devid):
        dev = DrbdDevice.objects.get(id=devid)
        fd = open("/etc/drbd.d/%s_%s.res" % (dev.volume.vg.name, dev.volume.name), "w")
        try:
            fd.write( render_to_string( "drbd/device.res", {
                'Hostname':  socket.gethostname(),
                'Device':    dev
                } ) )
        finally:
            fd.close()

    @method( in_signature="i", out_signature="")
    def conf_delete(self, devid):
        dev = DrbdDevice.objects.get(id=devid)
        os.unlink("/etc/drbd.d/%s_%s.res" % (dev.volume.vg.name, dev.volume.name))
