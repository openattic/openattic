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

from systemd  import dbus_to_python

from volumes.blockdevices import UnsupportedRAID
from volumes.filesystems.filesystem import FileSystem
from volumes import capabilities

class Ext2(FileSystem):
    """ Handler for Ext2 (without journal). """
    name = "ext2"
    desc = "Ext2 (deprecated)"

    @property
    def info(self):
        return dbus_to_python( self.dbus_object.e2fs_info( self.volume.storageobj.blockvolume.volume.path ) )

    def format(self):
        try:
            raidparams = self.volume.storageobj.blockvolume.volume.raid_params
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self.dbus_object.e2fs_format( self.volume.storageobj.blockvolume.volume.path, self.volume.storageobj.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.write_fstab()
        self.mount()
        self.chown()

    def shrink(self, oldmegs, newmegs):
        if self.mounted:
            self.unmount()
        self.dbus_object.e2fs_check( self.volume.storageobj.blockvolume.volume.path )
        # call grow for the actual resize2fs
        self.grow(oldmegs, newmegs)

    def post_shrink(self, oldmegs, newmegs):
        self.mount()

    def grow(self, oldmegs, newmegs):
        # grow can be called as part of shrink(), so make sure we set the `grow' param correctly
        self.dbus_object.e2fs_resize( self.volume.storageobj.blockvolume.volume.path, newmegs, (newmegs > oldmegs) )

    def set_uuid(self, value="", generate=False):
        """ Set the file system's UUID. """
        if generate:
            value = "random"
        self.dbus_object.e2fs_set_uuid( self.volume.storageobj.blockvolume.volume.path, value )

    @classmethod
    def check_type(cls, typestring):
        return "ext2 filesystem data" in typestring

class Ext3(Ext2):
    """ Handler for Ext3 (Ext2 + Journal). """
    name = "ext3"
    desc = "Ext3 (max. 32TiB)"

    def format(self):
        try:
            raidparams = self.volume.storageobj.blockvolume.volume.raid_params
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self.dbus_object.e3fs_format( self.volume.storageobj.blockvolume.volume.path, self.volume.storageobj.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.write_fstab()
        self.mount()
        self.chown()

    @classmethod
    def check_type(cls, typestring):
        return "ext3 filesystem data" in typestring


class Ext4(Ext2):
    """ Handler for ext4. """
    name = "ext4"
    desc = "Ext4 (recommended for file servers, supports Windows ACLs)"

    def format(self):
        try:
            raidparams = self.volume.storageobj.blockvolume.volume.raid_params
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self.dbus_object.e4fs_format( self.volume.storageobj.blockvolume.volume.path, self.volume.storageobj.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.write_fstab()
        self.mount()
        self.chown()

    @classmethod
    def check_type(cls, typestring):
        return "ext4 filesystem data" in typestring


class ExtFSDevice(capabilities.Device):
    model = Ext4
    requires = [
        capabilities.BlockbasedCapability,
        capabilities.FailureToleranceCapability,
        ]
    provides = [
        capabilities.FileSystemCapability,
        capabilities.PosixACLCapability,
        capabilities.GrowCapability,
        capabilities.ShrinkCapability,
        capabilities.FileIOCapability,
        ]
    removes  = [
        capabilities.BlockbasedCapability,
        capabilities.BlockIOCapability,
        ]

