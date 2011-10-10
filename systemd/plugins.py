# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus.service
from functools     import partial
from threading     import Lock

from django.conf   import settings

class BasePlugin(dbus.service.Object):
    def __init__(self, bus, busname, mainobj):
        self.bus     = bus
        self.busname = busname
        self.mainobj = mainobj
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    def job_add_command(self, jid, cmd):
        return self.mainobj._job_add_command(jid, cmd)

class LockingPlugin(BasePlugin):
    def __init__(self, bus, busname, mainobj):
        BasePlugin.__init__(self, bus, busname, mainobj)
        self.lock    = Lock()

method = partial( dbus.service.method, settings.DBUS_IFACE_SYSTEMD )
signal = partial( dbus.service.signal, settings.DBUS_IFACE_SYSTEMD )
