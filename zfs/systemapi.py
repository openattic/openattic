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
    dbus_path = "/zfs"

    @method(in_signature="ss", out_signature="a(ssss)")
    def zpool_get(self, device, field):
        args = ["zpool", "get", field]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split() for line in out.split("\n")[1:-1]]

    @method(in_signature="isss", out_signature="")
    def zpool_set(self, jid, device, field, value):
        cmd = ["zpool", "set", ("%s=%s" % (field, value)), device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="ss", out_signature="a(ssss)")
    def zfs_get(self, device, field):
        args = ["zfs", "get", "-H", field]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @method(in_signature="isss", out_signature="")
    def zfs_set(self, jid, device, field, value):
        cmd = ["zfs", "set", ("%s=%s" % (field, value)), device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="is", out_signature="")
    def zfs_mount(self, jid, device):
        cmd = ["zfs", "mount", device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="is", out_signature="")
    def zfs_unmount(self, jid, device):
        cmd = ["zfs", "unmount", device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="s", out_signature="i")
    def zfs_destroy(self, device):
        return invoke(["zpool", "destroy", device])

    @method(in_signature="isss", out_signature="")
    def zfs_format(self, jid, devpath, label, mountpoint):
        self.job_add_command(jid, ["zpool", "create", "-m", mountpoint, label, devpath])

    @method(in_signature="iss", out_signature="")
    def zfs_create_volume(self, jid, pool, volume):
        self.job_add_command(jid, ["zfs", "create", "%s/%s" % (pool, volume)])

    @method(in_signature="ss", out_signature="i")
    def zfs_destroy_volume(self, pool, volume):
        return invoke(["zfs", "destroy", "%s/%s" % (pool, volume)])

    @method(in_signature="iss", out_signature="")
    def zfs_create_snapshot(self, jid, orig, snapshot):
        self.job_add_command(jid, ["zfs", "snapshot", "%s@%s" % (orig, snapshot)])
        self.job_add_command(jid, ["zfs", "clone",
            "%s@%s" % (orig, snapshot),
            "%s/.%s" % (orig, snapshot)
            ])

    @method(in_signature="ss", out_signature="i")
    def zfs_destroy_snapshot(self, orig, snapshot):
        return invoke(["zfs", "destroy", "-R", "%s@%s" % (orig, snapshot)])

    @method(in_signature="ss", out_signature="i")
    def zfs_rollback_snapshot(self, orig, snapshot):
        return invoke(["zfs", "rollback", "-R", "%s@%s" % (orig, snapshot)])

    @method(in_signature="s", out_signature="a(sssssss)")
    def zfs_getspace(self, device):
        args = ["zfs", "list", "-Ho", "space"]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @method(in_signature="iss", out_signature="")
    def zfs_expand(self, jid, name, device):
        self.job_add_command(jid, ["zpool", "online", "-e", name, device])

