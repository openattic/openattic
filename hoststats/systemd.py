# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service

from django.conf import settings

from lvm.procutils import invoke
from lvm.systemd   import logged

@logged
class SystemD(dbus.service.Object):
    dbus_path = "/stats"

    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="s")
    def ohai(self):
        # I know I should json.loads this here, but DBus doesn't recognize the types
        # correctly :/
        ret, out, err = invoke(["ohai"], return_out_err=True, log=False)
        return out
