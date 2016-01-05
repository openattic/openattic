# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import dbus

from volumes.blockdevices import UnsupportedRAID
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Xfs(FileSystem):
    """ Handler for NTFS-3g. """
    name = "xfs"
    desc = "XFS (recommended for virtualization, optimized for parallel IO)"

    @property
    def info(self):
        return {}

    def get_agcount(self, megs=None):
        if megs is None:
            megs = self.volume.storageobj.megs
        usablesize   = megs * 1024 * 1024
        usableblocks = int( usablesize / 4096 )

        # see xfs_mkfs.c, calc_default_ag_geometry()
        if   usablesize >  512 * 1024**3:
            shift = 5
        elif usablesize >    8 * 1024**3:
            shift = 4
        elif usablesize >= 128 * 1024**2:
            shift = 3
        elif usablesize >=  64 * 1024**2:
            shift = 2
        elif usablesize >=  32 * 1024**2:
            shift = 1
        else:
            shift = 0

        agsize  = usableblocks >> shift
        agcount = usableblocks / agsize
        return agcount

    agcount = property(get_agcount)

    def format(self):
        try:
            raidparams = self.volume.storageobj.blockvolume.volume.raid_params
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}

        self.dbus_object.xfs_format( self.volume.storageobj.blockvolume.volume.path, raidparams["chunksize"], raidparams["datadisks"], self.agcount )
        self.write_fstab()
        self.mount()
        self.chown()

    def get_mount_options(self):
        if self.volume.storageobj.snapshot is not None:
            return ["nouuid"]
        return dbus.Array([], signature="as")

    def grow(self, oldmegs, newmegs):
        self.dbus_object.xfs_resize( self.path, newmegs )

    def set_uuid(self, value="", generate=False):
        """ Set the file system's UUID. """
        if generate:
            value = "generate"
        self.dbus_object.xfs_set_uuid( self.volume.storageobj.blockvolume.volume.path, value )

    @classmethod
    def check_type(cls, typestring):
        return "SGI XFS filesystem data" in typestring

class XfsDefaultBlocksDevice(capabilities.Device):
    requires = [
        capabilities.BlockbasedCapability,
        capabilities.FailureToleranceCapability,
        ]
    provides = [
        capabilities.FileSystemCapability,
        capabilities.PosixACLCapability,
        capabilities.GrowCapability,
        capabilities.ParallelIOCapability,
        capabilities.FileIOCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        capabilities.ShrinkCapability,
        ]

class XfsSectorBlocksDevice(capabilities.Device):
    requires = XfsDefaultBlocksDevice.requires
    provides = XfsDefaultBlocksDevice.provides + [capabilities.SectorBlocksCapability]
    removes  = XfsDefaultBlocksDevice.removes

