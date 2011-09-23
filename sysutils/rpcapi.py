# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
from django.conf import settings

class SysUtilsHandler(object):
    class model:
        class _meta:
            app_label = "sysutils"
            object_name = "System"

    def __init__(self, user):
        self.user = user

    def shutdown(self):
   	shutdown = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        shutdown.shutdown()
 
    def reboot(self):
   	reboot = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        reboot.reboot()


RPCD_HANDLERS = [SysUtilsHandler]
