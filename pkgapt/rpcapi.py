# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import dbus

from rpcd.handlers import BaseHandler
from django.conf import settings

from systemd.helpers import dbus_to_python

class PkgAptHandler(BaseHandler):
    handler_name = "pkgapt.Apt"

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
