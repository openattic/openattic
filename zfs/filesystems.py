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

from systemd  import dbus_to_python, get_dbus_object

from volumes.conf import settings as volumes_settings
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

SIZE_MULTIPLIERS = {
    'T': 1024**2,
    'G': 1024**1,
    'M': 1024**0,
    'K': 1024**-1,
}

def scale_to_megs(size):
    if size == '-':
        # faulty pool
        return None
    if size[-1] in SIZE_MULTIPLIERS:
        # size is something like "672.42G", scale to MBytes
        return float(size[:-1]) * SIZE_MULTIPLIERS[size[-1]]
    # size seems to be in bytes
    return float(size) * 1024**-2

class Zfs(FileSystem):
    """ Handler for ZFS. """
    name = "zfs"
    desc = "ZFS (supports snapshots, deduplication and compression)"
    mount_in_fstab = False
    supports_dedup = True
    supports_compression = True

    class ZfsOptions(object):
        def __init__(self, fs):
            self.fs = fs

        def __getitem__(self, item):
            return dbus_to_python(self.fs.dbus_object.zfs_get(self.fs.volume.fullname, item))[0][2]

        def __setitem__(self, item, value):
            self.fs.dbus_object.zfs_set(-1, self.fs.volume.fullname, item, str(value))

        def __iter__(self):
            return (data[1:3] for data in dbus_to_python(self.fs.dbus_object.zfs_get(self.fs.volume.fullname, "all")))

    class ZpoolOptions(object):
        def __init__(self, fs):
            self.fs = fs

        def __getitem__(self, item):
            return dbus_to_python(self.fs.dbus_object.zpool_get(self.fs.volume.name, item))[0][2]

        def __setitem__(self, item, value):
            self.fsdbus_object.zpool_set(-1, self.fs.volume.name, item, str(value))

        def __iter__(self):
            return (data[1:3] for data in dbus_to_python(self.fs.dbus_object.zpool_get(self.fs.volume.name, "all")))

    def __init__(self, volume, pool=None):
        FileSystem.__init__(self, volume)
        self.pool = pool or volume
        self._options = None
        self._pooloptions = None

    @property
    def dbus_object(self):
        return get_dbus_object("/zfs")

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
    def status(self):
        return self.pool_options["health"]

    @property
    def megs(self):
        return scale_to_megs(self.pool_options["size"])

    @property
    def usedmegs(self):
        return scale_to_megs(self.pool_options["allocated"])

    @property
    def info(self):
        opts = self.pool_options.copy()
        opts.update(self.options)
        return opts

    def format(self):
        self.dbus_object.zfs_format(self.volume.path, self.volume.name,
            os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.name))
        self.chown()

    def mount(self):
        self.dbus_object.zfs_mount(self.volume.name)

    def unmount(self):
        self.dbus_object.zfs_unmount(self.volume.name)

    def destroy(self):
        for snap in self.volume.zfssnapshot_set.all():
            snap.delete()
        for subv in self.volume.zfssubvolume_set.all():
            subv.delete()
        self.dbus_object.zfs_destroy(self.volume.name)

    def online_resize_available(self, grow):
        return grow

    def resize(self, grow):
        if not grow:
            raise SystemError("ZFS does not support shrinking.")
        else:
            self.dbus_object.zfs_expand( self.volume.name, self.volume.path )

    def create_subvolume(self, path):
        self.dbus_object.zfs_create_volume(self.pool.name, path)

    def destroy_subvolume(self, path):
        self.dbus_object.zfs_destroy_volume(self.pool.name, path)

    def create_snapshot(self, path):
        self.dbus_object.zfs_create_snapshot(self.volume.name, path)

    def destroy_snapshot(self, path):
        self.dbus_object.zfs_destroy_snapshot(self.volume.name, path)

    def rollback_snapshot(self, path):
        self.dbus_object.zfs_rollback_snapshot(self.volume.name, path)

    @property
    def mounted(self):
        try:
            return self.options["mounted"] == "yes"
        except dbus.DBusException:
            return None

    @property
    def path(self):
        try:
            return self.options["mountpoint"]
        except dbus.DBusException:
            return None

    @property
    def options(self):
        if self._options is None:
            self._options = Zfs.ZfsOptions(self)
        return self._options

    @property
    def pool_options(self):
        if self._pooloptions is None:
            self._pooloptions = Zfs.ZpoolOptions(self)
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
