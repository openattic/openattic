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

import os
from time import time
from systemd import invoke, logged, BasePlugin, method, signal

@logged
class SystemD(BasePlugin):
    dbus_path = "/btrfs"

    @method(in_signature="is", out_signature="")
    def format(self, jid, devpath):
        cmd = ["mkfs.btrfs"]
        cmd.append(devpath)
        self.job_add_command(jid, cmd)

    @method(in_signature="is", out_signature="")
    def create_subvolume(self, jid, subpath):
        cmd = ["btrfs", "subvolume", "create", subpath]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="ssb", out_signature="")
    def create_snapshot(self, origpath, snappath, readonly):
        if not os.path.exists(os.path.dirname(snappath)):
            os.makedirs(os.path.dirname(snappath))
        cmd = ["btrfs", "subvolume", "snapshot"]
        if readonly:
            cmd.append("-r")
        cmd.extend([origpath, snappath])
        invoke(cmd)

    @method(in_signature="s", out_signature="")
    def delete_subvolume(self, subpath):
        invoke(["btrfs", "subvolume", "delete", subpath])

