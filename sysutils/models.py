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

from django.db import models
from django.conf import settings

from systemd.helpers import dbus_to_python

class InitScript(models.Model):
    name        = models.CharField(max_length=50)

    def run_initscript(self, command):
        return dbus_to_python(
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").run_initscript(self.name, command)
            )

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


class NTP(models.Model):
    server = models.CharField(max_length=50)

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        ntp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        ntp.write_ntp()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        ntp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        ntp.write_ntp()
        return ret
