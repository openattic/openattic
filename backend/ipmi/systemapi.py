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

import re

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/ipmi"

    @method(in_signature="", out_signature="aas")
    def get_all_sensors(self):
        ret, out, err = invoke(["ipmitool", "sdr", "list", "all"], return_out_err=True)
        return [
            [ part.strip() for part in line.split('|') ]
            for line in out.split("\n") if line ]

    @method(in_signature="", out_signature="aas")
    def get_most_sensors(self):
        ret, out, err = invoke(["ipmitool", "sdr", "list", "full"], return_out_err=True)
        return [
            [ part.strip() for part in line.split('|') ]
            for line in out.split("\n") if line ]

    @method(in_signature="s", out_signature="aas")
    def get_sensors_by_type(self, stype):
        ret, out, err = invoke(["ipmitool", "sdr", "type", stype], return_out_err=True)
        return [
            [ part.strip() for part in line.split('|') ]
            for line in out.split("\n") if line ]

    @method(in_signature="", out_signature="as")
    def get_sensor_types(self):
        # ipmitool returns lines such as:
        # "\tSlot / Connector            System ACPI Power State".
        ret, out, err = invoke(["ipmitool", "sdr", "type", "list"], return_out_err=True)
        return reduce( lambda x, y: x + y,
            [ re.split( r"\s{2,}", line.strip() ) for line in out.split("\n")[1:] if line ] )
