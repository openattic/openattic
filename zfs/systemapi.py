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

from systemd import invoke, logged, BasePlugin, method, deferredmethod

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

    @deferredmethod(in_signature="sss")
    def zpool_set(self, device, field, value, sender):
        invoke(["zpool", "set", ("%s=%s" % (field, value)), device])

    @method(in_signature="ss", out_signature="a(ssss)")
    def zfs_get(self, device, field):
        args = ["zfs", "get", "-H", field]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @deferredmethod(in_signature="sss")
    def zfs_set(self, device, field, value, sender):
        invoke(["zfs", "set", ("%s=%s" % (field, value)), device])

    @deferredmethod(in_signature="s")
    def zfs_mount(self, device, sender):
        invoke(["zfs", "mount", device])

    @deferredmethod(in_signature="s")
    def zfs_unmount(self, device, sender):
        invoke(["zfs", "unmount", device])

    @deferredmethod(in_signature="s")
    def zpool_destroy(self, device, sender):
        invoke(["zpool", "destroy", device])

    @deferredmethod(in_signature="sss")
    def zpool_format(self, devpath, label, path, sender):
        invoke(["zpool", "create", "-f", "-m", path, label, devpath])

    @deferredmethod(in_signature="s")
    def zfs_create_volume(self, volume, sender):
        invoke(["zfs", "create", volume])

    @deferredmethod(in_signature="s")
    def zfs_destroy_volume(self, volume, sender):
        invoke(["zfs", "destroy", volume])

    @deferredmethod(in_signature="ss")
    def zfs_create_snapshot(self, orig, snapshot, sender):
        invoke(["zfs", "snapshot", "%s@%s" % (orig, snapshot)])
        invoke(["zfs", "clone", "%s@%s" % (orig, snapshot), "%s/.%s" % (orig, snapshot) ])

    @deferredmethod(in_signature="ss")
    def zfs_destroy_snapshot(self, orig, snapshot, sender):
        invoke(["zfs", "destroy", "-R", "%s@%s" % (orig, snapshot)])

    @deferredmethod(in_signature="ss")
    def zfs_rollback_snapshot(self, orig, snapshot, sender):
        invoke(["zfs", "rollback", "-R", "%s@%s" % (orig, snapshot)])

    @method(in_signature="s", out_signature="a(sssssss)")
    def zfs_getspace(self, device):
        args = ["zfs", "list", "-Ho", "space"]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @deferredmethod(in_signature="ss")
    def zpool_expand(self, name, device, sender):
        invoke(["zpool", "online", "-e", name, device])

