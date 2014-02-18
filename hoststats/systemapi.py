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

from systemd import invoke, logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/stats"

    @method(in_signature="", out_signature="s")
    def ohai(self):
        # I know I should json.loads this here, but DBus doesn't recognize the types
        # correctly :/
        ret, out, err = invoke(["ohai"], return_out_err=True, log=False)
        return out
