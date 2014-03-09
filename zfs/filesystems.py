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

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/zfs")

    @classmethod
    def format_blockvolume(cls, volume, options):
        from django.core.exceptions import ValidationError
        if volume.storageobj.name == "log":
            raise ValidationError({"name": ["ZFS volumes cannot be named 'log'."]})
        if volume.storageobj.name.startswith( "mirror" ):
            raise ValidationError({"name": ["ZFS volume.storageobj.names cannot start with 'mirror'."]})
        if volume.storageobj.name.startswith( "raidz" ):
            raise ValidationError({"name": ["ZFS volume.storageobj.names cannot start with 'raidz'."]})
        if volume.storageobj.name.startswith( "spare" ):
            raise ValidationError({"name": ["ZFS volume.storageobj.names cannot start with 'spare'."]})
        if re.match("^c[0-9]", volume.storageobj.name):
            raise ValidationError({"name": ["ZFS volume.storageobj.names cannot start with 'c[0-9]'."]})

        if "filesystem" in options:
            options = options.copy()
            del options["filesystem"]

        from zfs.models import Zpool, Zfs
        pool = Zpool(storageobj=volume.storageobj, host=volume.host)
        pool.full_clean()
        pool.save()
        zvol = Zfs(storageobj=volume.storageobj, zpool=pool, **options)
        zvol.full_clean()
        zvol.save()
        return zvol

    def __init__(self, zpool, zfs):
        FileSystem.__init__(self, zfs)
        self.zpool = zpool

    @property
    def dbus_object(self):
        return get_dbus_object("/zfs")

    @property
    def path(self):
        return os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.fullname)

    @property
    def status(self):
        try:
            return dbus_to_python(self.dbus_object.zpool_get(self.zpool.storageobj.name, "health"))[0][2].lower()
        except dbus.DBusException:
            return "unknown"

    def format(self):
        self.dbus_object.zpool_format(self.zpool.storageobj.blockvolume.volume.path, self.zpool.storageobj.name,
            os.path.join(volumes_settings.MOUNT_PREFIX, self.zpool.storageobj.name))
        self.chown()

    def destroy(self):
        self.dbus_object.zpool_destroy(self.zpool.storageobj.name)

    def mount(self):
        self.dbus_object.zfs_mount(self.volume.fullname)

    def unmount(self):
        self.dbus_object.zfs_unmount(self.volume.fullname)

    def create_subvolume(self, path):
        self.dbus_object.zfs_create_volume(self.zpool.storageobj.name, path)

    def destroy_subvolume(self, path):
        self.dbus_object.zfs_destroy_volume(self.zpool.storageobj.name, path)

    def create_snapshot(self, path):
        self.dbus_object.zfs_create_snapshot(self.volume.storageobj.name, path)

    def destroy_snapshot(self, path):
        self.dbus_object.zfs_destroy_snapshot(self.volume.storageobj.name, path)

    def rollback_snapshot(self, path):
        self.dbus_object.zfs_rollback_snapshot(self.volume.storageobj.name, path)


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
