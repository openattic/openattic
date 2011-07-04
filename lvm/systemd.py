# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service

from django.conf import settings

from procutils import invoke, lvm_vgs, lvm_lvs

class SystemD(dbus.service.Object):
    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, "/lvm")

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="a{sa{ss}}")
    def vgs(self):
        print "vgs!"
        return lvm_vgs()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="a{sa{ss}}")
    def lvs(self):
        print "lvs!"
        return lvm_lvs()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ssis", out_signature="i")
    def lvcreate(self, vgname, lvname, megs, snapshot):
        cmd = ["/sbin/lvcreate"]
        if snapshot:
            cmd.extend(["-s", snapshot])
        cmd.extend(["-L", ("%dM" % megs),
            '-n', lvname,
            vgname
            ])
        return invoke(cmd)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="sb", out_signature="i")
    def lvchange(self, device, active):
        return invoke(["/sbin/lvchange", ('-a' + {False: 'n', True: 'y'}[active]), device])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="si", out_signature="i")
    def lvresize(self, device, megs):
        return invoke(["/sbin/lvresize", '-L', ("%dM" % megs), device])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def lvremove(self, device):
        return invoke(["/sbin/lvremove", '-f', device])
