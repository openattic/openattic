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

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/twraid"

    @method(in_signature="sb", out_signature="i")
    def set_identify(self, path, state):
        statestr = { False: "off", True: "on" }[state]
        return invoke(["tw-cli", path, "set", "identify=%s" % statestr])
