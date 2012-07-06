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

from django.conf import settings

from rpcd.handlers import BaseHandler
from rpcd.handlers import ProxyHandler

from systemd.helpers import dbus_to_python

class IpmiHandler(BaseHandler):
    handler_name = "ipmi.Sensor"

    def get_all_sensors(self):
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ipmi").get_all_sensors())

    def get_most_sensors(self):
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ipmi").get_most_sensors())

    def get_sensors_by_type(self, stype):
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ipmi").get_sensors_by_type(stype))

    def get_sensor_types(self):
        return dbus_to_python(dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ipmi").get_sensor_types())


class IpmiProxy(ProxyHandler):
    handler_name = IpmiHandler.handler_name

    def get_all_sensors(self):
        return self._call_allpeers_method("get_all_sensors")

    def get_most_sensors(self):
        return self._call_allpeers_method("get_most_sensors")

    def get_sensors_by_type(self, stype):
        return self._call_allpeers_method("get_sensors_by_type", stype)

    def get_sensor_types(self):
        return self._call_allpeers_method("get_sensor_types")


RPCD_HANDLERS = [IpmiProxy]
