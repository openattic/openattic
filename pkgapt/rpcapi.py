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
        """ Update the package lists. """
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").update()

    def get_upgrade_changes(self, distupgrade):
        """ Return a list of changes that would be applied by `apt-get [dist-]upgrade`. """
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").get_upgrade_changes(distupgrade))

    def do_upgrade(self, distupgrade):
        """ Run `apt-get [dist-]upgrade`. """
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/pkgapt").do_upgrade(distupgrade)

RPCD_HANDLERS = [PkgAptHandler]
