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

import os.path

from lvm.blockdevices import UnsupportedRAID, get_raid_params

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
            megs = self.lv.megs
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

    def format(self, jid):
        try:
            raidparams = get_raid_params(self.lv.vg.get_pvs()[0]["LVM2_PV_NAME"])
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}

        self._lvm.xfs_format( jid, self.lv.path, raidparams["chunksize"], raidparams["datadisks"], self.agcount )
        self.mount(jid)
        self.chown(jid)

    def online_resize_available(self, grow):
        return grow

    def resize(self, jid, grow):
        if not grow:
            raise SystemError("XFS does not support shrinking.")
        self._lvm.xfs_resize( jid, self.mountpoint, self.lv.megs )

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

