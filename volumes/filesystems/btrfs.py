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
        from lvm.models import BtrfsSubvolume as BtrfsSubvolumeModel
        default = BtrfsSubvolumeModel(volume=self.lv, name="default")
        default.save(database_only=True)

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
