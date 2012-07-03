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
from time import time

from django.conf import settings

from rpcd.handlers import BaseHandler, ModelHandler
from sysutils.models import InitScript, NTP, Proxy

class SysUtilsHandler(BaseHandler):
    @classmethod
    def _get_handler_name(cls):
        return "sysutils.System"

    def shutdown(self):
        """ Shut down the system. """
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").shutdown()

    def reboot(self):
        """ Reboot the system. """
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").reboot()

    def get_time(self):
        """ Return the current time as a UNIX timestamp. """
        return int(time())

    def set_time(self, timestamp):
        """ Set the current system time from the given `timestamp`. """
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").set_time(timestamp)

class InitScriptHandler(ModelHandler):
    model = InitScript

    def get_status(self, id):
        """ Run the init script with the `status` command and return its exit status. """
        return InitScript.objects.get(id=id).status

    def all_with_status(self):
        """ Get all initscripts with their current status values """
        data = []
        for obj in self.model.objects.all():
            objdata = self._getobj(obj)
            objdata["status"] = obj.status
            data.append(objdata)
        return data

    def start(self, id):
        """ Start the service. """
        return InitScript.objects.get(id=id).start()

    def stop(self, id):
        """ Stop the service. """
        return InitScript.objects.get(id=id).stop()

class NTPHandler(ModelHandler):
    model = NTP

class ProxyHandler(ModelHandler):
    model = Proxy

RPCD_HANDLERS = [SysUtilsHandler, InitScriptHandler, NTPHandler, ProxyHandler]
