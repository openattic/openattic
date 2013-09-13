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
import re
import dbus

from systemd  import dbus_to_python
from lvm.conf import settings as lvm_settings
from lvm.blockdevices import UnsupportedRAID, get_raid_params

from volumes import capabilities

class FileSystem(object):
    """ Base class from which filesystem objects should be derived.

        Note that these are NOT models, they should fetch their information live from
        the file system metadata.

        The volume instance that is formatted with this file system instance can be
        accessed through ``self.lv``.

        Class variables:

         * name: File system type that can be passed to mount -t.
         * desc: Human-readable description.
         * mount_in_fstab: If True, a mount line for this volume will be included in /etc/fstab.
         * virtual: If True, denotes that the file system cannot be dealt with using the
           standard mount/stat/umount stuff, but needs some kind of more advanced treatment.
           E. g., it might reside on a volume that is mapped using iSCSI or FC.
    """

    name = "failfs"
    desc = "failing file system"
    mount_in_fstab = True
    supports_dedup = False
    supports_compression = False
    virtual = False

    class WrongFS(Exception):
        """ Raised when a filesystem handler detects that the volume is formatted with a different fs. """
        pass

    def __init__(self, logical_volume):
        self.lv = logical_volume
        self._lvm = self.lv.lvm
        # Make sure virtual FS handlers are only employed on volumes that don't have a native
        # FS configured and vice-versa.
        if not self.virtual:
            if self.lv.filesystem != self.name:
                raise FileSystem.WrongFS(self.name)
        else:
            if self.lv.filesystem:
                raise FileSystem.WrongFS(self.name)

    def clean_volume(self, volume):
        pass

    @property
    def fsname(self):
        return self.name

    @property
    def mountpoint(self):
        if self.virtual:
            raise NotImplementedError("FileSystem::mountpoint needs to be overridden for virtual FS handlers")
        return os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.name)

    @property
    def mounthost(self):
        if self.virtual:
            raise NotImplementedError("FileSystem::mounthost needs to be overridden for virtual FS handlers")
        return self.lv.vg.host

    @property
    def topleveldir(self):
        return self.mountpoint

    def mount(self, jid):
        """ Mount the file system.
        """
        if self.virtual:
            raise NotImplementedError("FileSystem::mount needs to be overridden for virtual FS handlers")
        self._lvm.fs_mount( jid, self.name, self.lv.path, self.mountpoint )

    @property
    def mounted(self):
        """ True if the volume is currently mounted. """
        if self.virtual:
            raise NotImplementedError("FileSystem::mounted needs to be overridden for virtual FS handlers")
        return os.path.ismount(self.mountpoint)

    def unmount(self, jid):
        """ Unmount the volume. """
        if self.virtual:
            raise NotImplementedError("FileSystem::unmount needs to be overridden for virtual FS handlers")
        self._lvm.fs_unmount( jid, self.lv.path, self.mountpoint )

    def format(self, jid):
        """ Format the volume. """
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def online_resize_available(self, grow):
        """ Tell whether or not this file system supports online resize.

            As a fallback, assume it does not.
        """
        return False

    def resize(self, jid, grow):
        """ Add a command to the job with the given ``jid`` to resize the file system
            to the current volume size.
        """
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    @property
    def info(self):
        """ Return all file system metadata. """
        raise NotImplementedError("FileSystem::info needs to be overridden")

    def chown(self, jid):
        """ Change ownership of the filesystem to be the LV's owner. """
        if self.virtual:
            raise NotImplementedError("FileSystem::chown needs to be overridden for virtual FS handlers")
        return self._lvm.fs_chown( jid, self.mountpoint, self.lv.owner.username, lvm_settings.CHOWN_GROUP )

    def destroy(self):
        """ Destroy the file system. """
        pass

    def stat(self):
        """ stat() the file system and return usage statistics. """
        if self.virtual:
            raise NotImplementedError("FileSystem::stat needs to be overridden for virtual FS handlers")
        s = os.statvfs(self.mountpoint)
        stats = {
            'size': (s.f_blocks * s.f_frsize) / 1024 / 1000.,
            'free': (s.f_bavail * s.f_frsize) / 1024 / 1000.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024 / 1000.,
            }
        stats['sizeG'] = stats['size'] / 1024.
        stats['freeG'] = stats['free'] / 1024.
        stats['usedG'] = stats['used'] / 1024.
        return stats

    @classmethod
    def check_type(cls, typestring):
        return False

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/mkfs.%s" % cls.name)

class Ext2(FileSystem):
    """ Handler for Ext2 (without journal). """
    name = "ext2"
    desc = "Ext2 (deprecated)"

    @property
    def info(self):
        return dbus_to_python( self.lv.lvm.e2fs_info( self.lv.path ) )

    def online_resize_available(self, grow):
        """ Tell whether or not this file system supports online resize.

            Ext* file systems do support it for growing, but not for shrinking.
        """
        return grow

    def format(self, jid):
        try:
            raidparams = get_raid_params(self.lv.vg.get_pvs()[0]["LVM2_PV_NAME"])
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self._lvm.e2fs_format( jid, self.lv.path, self.lv.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.mount(jid)
        self.chown(jid)

    def resize(self, jid, grow):
        if not grow:
            self._lvm.e2fs_check( jid, self.lv.path )
        self._lvm.e2fs_resize( jid, self.lv.path, self.lv.megs, grow )

    @classmethod
    def check_type(cls, typestring):
        return "ext2 filesystem data" in typestring

class Ext3(Ext2):
    """ Handler for Ext3 (Ext2 + Journal). """
    name = "ext3"
    desc = "Ext3 (max. 32TiB)"

    def format(self, jid):
        try:
            raidparams = get_raid_params(self.lv.vg.get_pvs()[0]["LVM2_PV_NAME"])
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self._lvm.e3fs_format( jid, self.lv.path, self.lv.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.mount(jid)
        self.chown(jid)

    @classmethod
    def check_type(cls, typestring):
        return "ext3 filesystem data" in typestring


class Ext4(Ext2):
    """ Handler for ext4. """
    name = "ext4"
    desc = "Ext4 (recommended for file servers, supports Windows ACLs)"

    def format(self, jid):
        try:
            raidparams = get_raid_params(self.lv.vg.get_pvs()[0]["LVM2_PV_NAME"])
        except UnsupportedRAID:
            raidparams = {"chunksize": -1, "datadisks": -1}
        self._lvm.e4fs_format( jid, self.lv.path, self.lv.name, raidparams["chunksize"], raidparams["datadisks"] )
        self.mount(jid)
        self.chown(jid)

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




class Zfs(FileSystem):
    """ Handler for ZFS. """
    name = "zfs"
    desc = "ZFS (supports snapshots, deduplication and compression)"
    mount_in_fstab = False
    supports_dedup = True
    supports_compression = True

    class ZfsOptions(dict):
        def __init__(self, fs, data):
            self.fs = fs
            dict.__init__(self, data)

        def __getitem__(self, item):
            return dbus_to_python(self.fs.lv.lvm.zfs_get(self.fs.lv.name, item))[0][2]

        def __setitem__(self, item, value):
            self.fs.lv.lvm.zfs_set(-1, self.fs.lv.name, item, str(value))

    class ZpoolOptions(dict):
        def __init__(self, fs, data):
            self.fs = fs
            dict.__init__(self, data)

        def __getitem__(self, item):
            return dbus_to_python(self.fs.lv.lvm.zpool_get(self.fs.lv.name, item))[0][2]

        def __setitem__(self, item, value):
            self.fs.lv.lvm.zpool_set(-1, self.fs.lv.name, item, str(value))

    def __init__(self, logical_volume):
        FileSystem.__init__(self, logical_volume)
        self._options = None
        self._pooloptions = None

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
    def info(self):
        opts = self.pool_options.copy()
        opts.update(self.options)
        return opts

    def format(self, jid):
        self._lvm.zfs_format(jid, self.lv.path, self.lv.name,
            os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.name))
        if self.lv.dedup:
            self._lvm.zfs_set(jid, self.lv.name, "dedup", "on")
        if self.lv.compression:
            self._lvm.zfs_set(jid, self.lv.name, "compression", "on")
        self.chown(jid)

    def mount(self, jid):
        self._lvm.zfs_mount(jid, self.lv.name)

    def unmount(self, jid):
        self._lvm.zfs_unmount(jid, self.lv.name)

    def destroy(self):
        for snap in self.lv.zfssnapshot_set.all():
            snap.delete()
        for subv in self.lv.zfssubvolume_set.all():
            subv.delete()
        self._lvm.zfs_destroy(self.lv.name)

    def online_resize_available(self, grow):
        return grow

    def resize(self, jid, grow):
        if not grow:
            raise SystemError("ZFS does not support shrinking.")
        else:
            self._lvm.zfs_expand( jid, self.lv.name, self.lv.path )

    def create_subvolume(self, jid, subvolume):
        self._lvm.zfs_create_volume(jid, self.lv.name, subvolume.volname)

    def destroy_subvolume(self, subvolume):
        self._lvm.zfs_destroy_volume(self.lv.name, subvolume.volname)

    def create_snapshot(self, jid, snapshot):
        self._lvm.zfs_create_snapshot(jid, snapshot.origvolume.name, snapshot.snapname)

    def destroy_snapshot(self, snapshot):
        self._lvm.zfs_destroy_snapshot(snapshot.origvolume.name, snapshot.snapname)

    def rollback_snapshot(self, snapshot):
        self._lvm.zfs_rollback_snapshot(snapshot.origvolume.name, snapshot.snapname)

    @property
    def mounted(self):
        try:
            return self.options["mounted"] == "yes"
        except dbus.DBusException:
            return None

    @property
    def options(self):
        if self._options is None:
            self._options = Zfs.ZfsOptions(self, [data[1:3] for data in dbus_to_python(self.lv.lvm.zfs_get(self.lv.name, "all"))])
        return self._options

    @property
    def pool_options(self):
        if self._pooloptions is None:
            self._pooloptions = Zfs.ZpoolOptions(self, [data[1:3] for data in dbus_to_python(self.lv.lvm.zpool_get(self.lv.name, "all"))])
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
    def topleveldir(self):
        # check if the default subvolume exists. if it doesn't, use any
        # other. if there is no other subvolume, fall back to the mountpoint.
        from lvm.models import BtrfsSubvolume
        try:
            return self.lv.btrfssubvolume_set.get(name="default").path
        except BtrfsSubvolume.DoesNotExist:
            try:
                return self.lv.btrfssubvolume_set.filter(snapshot__isnull=True)[0].path
            except IndexError:
                return self.mountpoint

    def online_resize_available(self, grow):
        return False

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



FILESYSTEMS = [
    fsclass for fsclass in [Ext2, Ext3, Ext4, Xfs, Zfs, Btrfs, Ocfs2]
    if fsclass.check_installed() ]


def get_by_name(name):
    """ Return the file system class with the given ``name``. """
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
