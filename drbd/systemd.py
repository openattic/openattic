# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service
import subprocess
import socket

from django.template.loader import render_to_string
from django.conf import settings

from lvm.procutils import invoke
from drbd.models   import DrbdDevice

class SystemD(dbus.service.Object):
    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, "/drbd")

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def createmd(self, resource):
        return invoke(["/sbin/drbdadm", "create-md", resource], stdin="yes\n")

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def attach(self, resource):
        return invoke(["/sbin/drbdadm", "attach", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def connect(self, resource):
        return invoke(["/sbin/drbdadm", "connect", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def up(self, resource):
        return invoke(["/sbin/drbdadm", "up", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def primary(self, resource):
        return invoke(["/sbin/drbdadm", "--", "primary", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def primary_overwrite(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--overwrite-data-of-peer", "primary", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def primary_force(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--force", "primary", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def secondary(self, path):
        return invoke(["/sbin/drbdadm", "--", path, "secondary"])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def adjust(self, resource):
        return invoke(["/sbin/drbdadm", "adjust", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def disconnect(self, resource):
        return invoke(["/sbin/drbdadm", "disconnect", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def detach(self, resource):
        return invoke(["/sbin/drbdadm", "detach", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def down(self, resource):
        return invoke(["/sbin/drbdadm", "down", resource])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="a{ss}")
    def get_dstate(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "dstate", resource], return_out_err=True)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="s")
    def get_cstate(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "cstate", resource], return_out_err=True)
        return out.strip()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="a{ss}")
    def get_role(self, resource):
        ret, out, err = invoke(["/sbin/drbdadm", "role", resource], return_out_err=True)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="i", out_signature="")
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

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="i", out_signature="")
    def conf_delete(self, devid):
        dev = DrbdDevice.objects.get(id=devid)
        os.unlink("/etc/drbd.d/%s_%s.res" % (dev.volume.vg.name, dev.volume.name))
