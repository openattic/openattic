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

        # Create a subvolume named .snapshots for snapshots to reside in.
        from volumes.models import StorageObject
        dso = StorageObject(name=".snapshots", megs=volume.storageobj.megs)
        dso.full_clean()
        dso.save()
        dvol = pool._create_volume_for_storageobject(dso, {})

        return zvol

    def __init__(self, zpool, zfs):
        # We do *not* call FileSystem.__init__ here because there's a check in there
        # that makes sure that FileSystem instances can only be created for volumes
        # that actually *have* a file system, which BlockVolumes do not.
        # Unless it's a ZVol.
        # In that case, you need a FileSystem handler in order to manipulate a block
        # device, which doesn't really make any sense but that's the way it is.
        self.volume = zfs
        self.zpool = zpool

    @property
    def dbus_object(self):
        return get_dbus_object("/zfs")

    @property
    def path(self):
        if "/" not in self.volume.fullname:
            subpath = ""
        else:
            subpath = os.path.join(*os.path.split(self.volume.fullname)[1:])

        if self.volume.storageobj.snapshot is None:
            return os.path.join(volumes_settings.MOUNT_PREFIX, self.zpool.storageobj.name, subpath)
        else:
            return os.path.join(volumes_settings.MOUNT_PREFIX, self.zpool.storageobj.name, ".snapshots", subpath)

    @property
    def status(self):
        try:
            return dbus_to_python(self.dbus_object.zpool_get(self.zpool.storageobj.name, "health"))[0][2].lower()
        except dbus.DBusException:
            return "unknown"

    @property
    def stat(self):
        """ stat() the file system and return usage statistics. """
        if self.virtual:
            raise NotImplementedError("FileSystem::stat needs to be overridden for virtual FS handlers")
        if not self.mounted:
            return {'size': None, 'free': None, 'used': None}
        s = os.statvfs(self.path)
        stats = {
            'size': self.volume.storageobj.megs,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024. / 1024.,
            }
        stats["free"] = stats["size"] - stats["used"]
        return stats

    @property
    def allocated_megs(self):
        return scale_to_megs(dbus_to_python(self.dbus_object.zpool_get(
                self.zpool.storageobj.name, "allocated"))[0][2])

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

    def create_subvolume(self):
        self.dbus_object.zfs_create_volume(self.volume.fullname)

    def create_zvol(self):
        self.dbus_object.zvol_create_volume(self.volume.fullname, self.volume.storageobj.megs)

    def destroy_subvolume(self):
        self.dbus_object.zfs_destroy_volume(self.volume.fullname)

    def create_snapshot(self, orig_zfs):
        """ Create a snapshot of the given orig_zfs and clone it to the .snapshots subdirectory. """
        snapfullname = "%s@%s" % (orig_zfs.fullname, self.volume.storageobj.name)
        snapfullpath = os.path.join(self.zpool.storageobj.name, ".snapshots", self.volume.storageobj.name)
        self.dbus_object.zfs_create_snapshot(snapfullname)
        self.dbus_object.zfs_clone(snapfullname, snapfullpath)

    def create_zvol_snapshot(self, orig_zvol):
        """ Create a snapshot. """
        snapfullname = "%s@%s" % (orig_zvol.fullname, self.volume.storageobj.name)
        self.dbus_object.zfs_create_snapshot(snapfullname)

    def destroy_snapshot(self, orig_zfs):
        snapfullname = "%s@%s" % (orig_zfs.fullname, self.volume.storageobj.name)
        self.dbus_object.zfs_destroy_snapshot(snapfullname)

    def rollback_snapshot(self, orig_zfs):
        snapfullname = "%s@%s" % (orig_zfs.fullname, self.volume.storageobj.name)
        self.dbus_object.zfs_rollback_snapshot(snapfullname)


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
