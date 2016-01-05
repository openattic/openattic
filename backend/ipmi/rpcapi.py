# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from systemd import dbus_to_python, get_dbus_object

class IpmiHandler(BaseHandler):
    handler_name = "ipmi.Sensor"

    def get_all_sensors(self):
        return dbus_to_python(get_dbus_object("/ipmi").get_all_sensors())

    def get_most_sensors(self):
        return dbus_to_python(get_dbus_object("/ipmi").get_most_sensors())

    def get_sensors_by_type(self, stype):
        return dbus_to_python(get_dbus_object("/ipmi").get_sensors_by_type(stype))

    def get_sensor_types(self):
        return dbus_to_python(get_dbus_object("/ipmi").get_sensor_types())


RPCD_HANDLERS = [IpmiHandler]
