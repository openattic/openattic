# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

from systemd import get_dbus_object
from volumes.conf import settings as volumes_settings
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Btrfs(FileSystem):
    name = "btrfs"
    desc = "BTRFS (Experimental)"

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/btrfs")

    @classmethod
    def format_blockvolume(cls, volume, options):
        from btrfs.models import Btrfs, BtrfsSubvolume
        from volumes.models import StorageObject

        pool = Btrfs(storageobj=volume.storageobj, host=volume.host)
        pool.full_clean()
        pool.save()
        svol = BtrfsSubvolume(storageobj=volume.storageobj, btrfs=pool, **options)
        svol.full_clean()
        svol.save()

        # Create a subvolume named .snapshots for snapshots to reside in.
        dso = StorageObject(name=".snapshots", megs=volume.storageobj.megs, source_pool=pool)
        dso.full_clean()
        dso.save()
        dvol = pool._create_volume_for_storageobject(dso, {
            "filesystem": "btrfs", "fswarning": 99, "fscritical": 99, "owner": options["owner"]
            })

        return svol

    @classmethod
    def configure_blockvolume(cls, volume):
        from django.contrib.auth.models import User
        from btrfs.models import Btrfs, BtrfsSubvolume
        from volumes.models import StorageObject

        try:
            admin = User.objects.get(username="openattic")
        except User.DoesNotExist:
            admin = User.objects.filter(is_superuser=True)[0]

        pool = Btrfs(storageobj=volume.storageobj, host=volume.host)
        pool.full_clean()
        pool.save()
        svol = BtrfsSubvolume(storageobj=volume.storageobj, btrfs=pool,
                              fswarning=75, fscritical=85, owner=admin)
        svol.full_clean()
        svol.save(database_only=True)
        svol.mount()

        # Create a subvolume named .snapshots for snapshots to reside in.
        try:
            snapshots = pool.volume_set.get(name=".snapshots")
        except StorageObject.DoesNotExist:
            dso = StorageObject(name=".snapshots", megs=volume.storageobj.megs, source_pool=pool)
            dso.full_clean()
            dso.save()
            dvol = pool._create_volume_for_storageobject(dso, {
                "filesystem": "btrfs", "fswarning": 99, "fscritical": 99, "owner": admin
                })

        return svol

    def __init__(self, btrfs, btrfssubvolume):
        FileSystem.__init__(self, btrfssubvolume)
        self.btrfs = btrfs

    @property
    def info(self):
        return {}

    @property
    def dbus_object(self):
        return get_dbus_object("/btrfs")

    def format(self):
        self.dbus_object.format( self.btrfs.storageobj.blockvolume.volume.path )
        self.write_fstab()
        self.mount()
        self.chown()

    @property
    def path(self):
        if "/" not in self.volume.fullname:
            subpath = ""
        else:
            subpath = os.path.join(*os.path.split(self.volume.fullname)[1:])

        if self.volume.storageobj.snapshot is None:
            return os.path.join(volumes_settings.MOUNT_PREFIX, self.btrfs.storageobj.name, subpath)
        else:
            return os.path.join(volumes_settings.MOUNT_PREFIX, self.btrfs.storageobj.name, ".snapshots", subpath)

    @classmethod
    def check_type(cls, typestring):
        return "BTRFS" in typestring

    def create_subvolume(self):
        # self represents the subvolume to be created.
        self.dbus_object.create_subvolume(self.path)

    def create_snapshot(self, origin, readonly=False):
        # self represents the snapshot to be created with contents from origin.
        self.dbus_object.create_snapshot(origin.path, self.path, readonly)

    def delete_subvolume(self):
        # self represents the snapshot to be deleted.
        self.dbus_object.delete_subvolume(self.path)

class BtrfsDevice(capabilities.Device):
    requires = [
        capabilities.BlockbasedCapability,
        capabilities.FailureToleranceCapability,
        ]
    provides = [
        capabilities.FileSystemCapability,
        capabilities.VolumeSnapshotCapability,
        capabilities.SubvolumesCapability,
        capabilities.SubvolumeSnapshotCapability,
        capabilities.FileSnapshotCapability,
        capabilities.GrowCapability,
        capabilities.ShrinkCapability,
        capabilities.DeduplicationCapability,
        capabilities.CompressionCapability,
        capabilities.PosixACLCapability,
        capabilities.FileIOCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        ]

class BtrfsSubvolumeDevice(capabilities.Device):
    requires = BtrfsDevice



