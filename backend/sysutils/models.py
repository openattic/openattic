# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

from django.db import models
from django.dispatch import Signal

from systemd import dbus_to_python, get_dbus_object

pre_install  = Signal()
post_install = Signal()

class InitScript(models.Model):
    name        = models.CharField(max_length=50)

    def run_initscript(self, command):
        return dbus_to_python(get_dbus_object("/sysutils").run_initscript(self.name, command))

    def start(self):
        return self.run_initscript("start")

    def stop(self):
        return self.run_initscript("stop")

    @property
    def status(self):
        try:
            return self.run_initscript("status")
        except dbus.DBusException:
            return None

    @property
    def running(self):
        return self.status == 0

    @property
    def stopped(self):
        return self.status == 3
