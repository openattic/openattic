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

from volumes.conf import settings as volumes_settings
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Btrfs(FileSystem):
    name = "btrfs"
    desc = "BTRFS (Experimental)"

    @property
    def info(self):
        return {}

    def format(self, jid):
        self._lvm.btrfs_format( jid, self.lv.path )
        self.mount(jid)
        self.chown(jid)
        self._lvm.btrfs_create_subvolume(jid, os.path.join(self.mountpoint, "default"))
        from lvm.models import BtrfsSubvolume
        default = BtrfsSubvolume(volume=self.lv, name="default")
        default.save(database_only=True)

    @property
    def mountpoint(self):
        return os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.fullname)

    @property
    def mounted(self):
        return os.path.ismount(os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.btrfs.name))

    @classmethod
    def check_type(cls, typestring):
        return False

    def create_subvolume(self, subvolume):
        if subvolume.snapshot is not None:
            self._lvm.btrfs_create_snapshot(subvolume.snapshot.path, subvolume.path, subvolume.readonly)
        else:
            self._lvm.btrfs_create_subvolume(-1, subvolume.path)

    def delete_subvolume(self, subvolume):
        self._lvm.btrfs_delete_subvolume(subvolume.path)

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

class BtrfsSubvolume(capabilities.Device):
    requires = BtrfsDevice



