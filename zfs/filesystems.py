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
import os.path
import re
import dbus

from systemd  import dbus_to_python
from lvm.conf import settings as lvm_settings
from lvm.blockdevices import UnsupportedRAID, get_raid_params

from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Zfs(FileSystem):
    """ Handler for ZFS. """
    name = "zfs"
    desc = "ZFS (supports snapshots, deduplication and compression)"
    mount_in_fstab = False
    supports_dedup = True
    supports_compression = True

    class ZfsOptions(dict):
        def __init__(self, fs, data):
            self.fs = fs
            dict.__init__(self, data)

        def __getitem__(self, item):
            return dbus_to_python(self.fs.dbus_object.zfs_get(self.fs.volume.name, item))[0][2]

        def __setitem__(self, item, value):
            self.fs.dbus_object.zfs_set(-1, self.fs.volume.name, item, str(value))

    class ZpoolOptions(dict):
        def __init__(self, fs, data):
            self.fs = fs
            dict.__init__(self, data)

        def __getitem__(self, item):
            return dbus_to_python(self.fs.dbus_object.zpool_get(self.fs.volume.name, item))[0][2]

        def __setitem__(self, item, value):
            self.fsdbus_object.zpool_set(-1, self.fs.volume.name, item, str(value))

    def __init__(self, volume):
        FileSystem.__init__(self, volume)
        self._options = None
        self._pooloptions = None

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/zfs")

    def clean_volume(self, volume):
        from django.core.exceptions import ValidationError
        if volume.name == "log":
            raise ValidationError({"name": ["ZFS volumes cannot be named 'log'."]})
        if volume.name.startswith( "mirror" ):
            raise ValidationError({"name": ["ZFS volume names cannot start with 'mirror'."]})
        if volume.name.startswith( "raidz" ):
            raise ValidationError({"name": ["ZFS volume names cannot start with 'raidz'."]})
        if volume.name.startswith( "spare" ):
            raise ValidationError({"name": ["ZFS volume names cannot start with 'spare'."]})
        if re.match("^c[0-9]", volume.name):
            raise ValidationError({"name": ["ZFS volume names cannot start with 'c[0-9]'."]})

    @property
    def dbus_object(self):
        return self.volume.zpool.dbus_object

    @property
    def info(self):
        opts = self.pool_options.copy()
        opts.update(self.options)
        return opts

    def format(self, jid):
        self.dbus_object.zfs_format(jid, self.volume.path, self.volume.name,
            os.path.join(lvm_settings.MOUNT_PREFIX, self.volume.name))
        if self.volume.dedup:
            self.dbus_object.zfs_set(jid, self.volume.name, "dedup", "on")
        if self.volume.compression:
            self.dbus_object.zfs_set(jid, self.volume.name, "compression", "on")
        self.chown(jid)

    def mount(self, jid):
        self.dbus_object.zfs_mount(jid, self.volume.name)

    def unmount(self, jid):
        self.dbus_object.zfs_unmount(jid, self.volume.name)

    def destroy(self):
        for snap in self.volume.zfssnapshot_set.all():
            snap.delete()
        for subv in self.volume.zfssubvolume_set.all():
            subv.delete()
        self.dbus_object.zfs_destroy(self.volume.name)

    def online_resize_available(self, grow):
        return grow

    def resize(self, jid, grow):
        if not grow:
            raise SystemError("ZFS does not support shrinking.")
        else:
            self.dbus_object.zfs_expand( jid, self.volume.name, self.volume.path )

    def create_subvolume(self, jid, subvolume):
        self.dbus_object.zfs_create_volume(jid, self.volume.name, subvolume.volname)

    def destroy_subvolume(self, subvolume):
        self.dbus_object.zfs_destroy_volume(self.volume.name, subvolume.volname)

    def create_snapshot(self, jid, snapshot):
        self.dbus_object.zfs_create_snapshot(jid, snapshot.origvolume.name, snapshot.snapname)

    def destroy_snapshot(self, snapshot):
        self.dbus_object.zfs_destroy_snapshot(snapshot.origvolume.name, snapshot.snapname)

    def rollback_snapshot(self, snapshot):
        self.dbus_object.zfs_rollback_snapshot(snapshot.origvolume.name, snapshot.snapname)

    @property
    def mounted(self):
        try:
            return self.options["mounted"] == "yes"
        except dbus.DBusException:
            return None

    @property
    def options(self):
        if self._options is None:
            self._options = Zfs.ZfsOptions(self, [data[1:3] for data in dbus_to_python(self.dbus_object.zfs_get(self.volume.name, "all"))])
        return self._options

    @property
    def pool_options(self):
        if self._pooloptions is None:
            self._pooloptions = Zfs.ZpoolOptions(self, [data[1:3] for data in dbus_to_python(self.dbus_object.zpool_get(self.volume.name, "all"))])
        return self._pooloptions


class ZpoolDevice(capabilities.Device):
    model = Zfs
    requires = [
        capabilities.BlockbasedCapability,
        ]
    provides = [
        capabilities.FailureToleranceCapability,
        capabilities.FileSystemCapability,
        capabilities.VolumeSnapshotCapability,
        capabilities.SubvolumesCapability,
        capabilities.SubvolumeSnapshotCapability,
        capabilities.FileSnapshotCapability,
        capabilities.GrowCapability,
        capabilities.ShrinkCapability,
        capabilities.DeduplicationCapability,
        capabilities.CompressionCapability,
        capabilities.FileIOCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        ]

class ZfsDevice(capabilities.Device):
    requires = ZpoolDevice
