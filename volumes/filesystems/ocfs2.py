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

class Ocfs2(FileSystem):
    """ Handler for OCFS2. """
    name = "ocfs2"
    desc = "OCFS2 (Cluster File System)"

    @property
    def info(self):
        return {}

    def format(self, jid):
        try:
            raidparams = get_raid_params(self.lv.vg.get_pvs()[0]["LVM2_PV_NAME"])
        except UnsupportedRAID:
            raidparams = {"chunksize": -1}
        self._lvm.ocfs2_format( jid, self.lv.path, raidparams["chunksize"] )
        self.mount(jid)
        self.chown(jid)

    def online_resize_available(self, grow):
        return False

    @classmethod
    def check_type(cls, typestring):
        return False

class Ocfs2Device(capabilities.Device):
    model = Ocfs2
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
        capabilities.MirroredFileSystemCapability,
        capabilities.MultiPrimaryFileSystemCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        capabilities.ShrinkCapability,
        ]

