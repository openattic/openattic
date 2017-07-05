# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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
import logging
from systemd.plugins import logged, BasePlugin, method


logger = logging.getLogger(__name__)


@logged
class SystemD(BasePlugin):
    dbus_path = "/oa_settings"

    @method(in_signature="ss", out_signature="i")
    def write_openattic_config(self, filename, content):
        logger.info("Writing openattic settings to %s", filename)
        try:
            with open(filename, "w") as f:
                f.write(content)
        except IOError as e:
            logger.error("ERROR: %s", e)
            return e.errno
        return 0
