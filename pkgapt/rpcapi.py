# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from rpcd.handlers import BaseHandler
from django.conf import settings

from systemd.helpers import dbus_to_python

class PkgAptHandler(BaseHandler):
    @classmethod
    def _get_handler_name(cls):
        return "pkgapt.Apt"

    def update(self):
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").update()

    def get_upgrade_changes(self, distupgrade):
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").get_upgrade_changes(distupgrade))

    def do_upgrade(self, distupgrade):
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").do_upgrade(distupgrade)

RPCD_HANDLERS = [PkgAptHandler]
