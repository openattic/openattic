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
import dbus

from systemd  import dbus_to_python
from lvm.conf import settings as lvm_settings
from lvm      import signals  as lvm_signals


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
    """

    name = "failfs"
    desc = "failing file system"
    mount_in_fstab = True

    def __init__(self, logical_volume):
        self.lv = logical_volume
        self._lvm = self.lv.lvm

    @property
    def mountpoints(self):
        """ Return a list of mount points. Currently, only the first one is used. """
        return [os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name)]

    def mount(self, jid, mountpoint=None):
        """ Mount the file system at the given mountpoint, or the first one if
            mountpoint is omitted.
        """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        self._lvm.fs_mount( jid, self.name, self.lv.path, mountpoint )

    @property
    def mounted(self, mountpoint=None):
        """ True if the volume is currently mounted. """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        return os.path.ismount(mountpoint)

    def unmount(self, jid, mountpoint=None):
        """ Unmount the volume. """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        self._lvm.fs_unmount( jid, self.lv.path, mountpoint )

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
        for mp in self.mountpoints:
            ret = self._lvm.fs_chown( jid, mp, self.lv.owner.username, lvm_settings.CHOWN_GROUP )
            if ret != 0:
                return ret
        return 0

    def destroy(self):
        """ Destroy the file system. """
        pass

    @property
    def stat(self, mountpoint=None):
        """ stat() the file system and return usage statistics. """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        s = os.statvfs(mountpoint)
        stats = {
            'size': (s.f_blocks * s.f_frsize) / 1024 / 1000.,
            'free': (s.f_bavail * s.f_frsize) / 1024 / 1000.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024 / 1000.,
            }
        stats['sizeG'] = stats['size'] / 1024.
        stats['freeG'] = stats['free'] / 1024.
        stats['usedG'] = stats['used'] / 1024.
        return stats

class Ext2(FileSystem):
    """ Handler for Ext2 (without journal). """
    name = "ext2"
    desc = "Ext2 (Linux)"

    @property
    def info(self):
        return dbus_to_python( self.lv.lvm.e2fs_info( self.lv.path ) )

    def online_resize_available(self, grow):
        """ Tell whether or not this file system supports online resize.

            Ext* file systems do support it for growing, but not for shrinking.
        """
        return grow

    def format(self, jid):
        self._lvm.e2fs_format( jid, self.lv.path, self.lv.name )
        self.mount(jid)
        self.chown(jid)

    def resize(self, jid, grow):
        if not grow:
            self._lvm.e2fs_check( jid, self.lv.path )
        self._lvm.e2fs_resize( jid, self.lv.path, self.lv.megs, grow )

class Ext3(Ext2):
    """ Handler for Ext3 (Ext2 + Journal). """
    name = "ext3"
    desc = "Ext3 (Linux Journalling)"

    def format(self, jid):
        self._lvm.e3fs_format( jid, self.lv.path, self.lv.name )
        self.mount(jid)
        self.chown(jid)


class Ext4(Ext2):
    """ Handler for ext4. """
    name = "ext4"
    desc = "Ext4 (Linux Journalling)"

    def format(self, jid):
        self._lvm.e4fs_format( jid, self.lv.path, self.lv.name )
        self.mount(jid)
        self.chown(jid)


class Zfs(FileSystem):
    """ Handler for ZFS on Fuse. """
    name = "zfs"
    desc = "ZFS on FUSE"
    mount_in_fstab = False

    @property
    def info(self):
        return dbus_to_python(self.lv.lvm.zfs_get(self.lv.name, "all"))

    def format(self, jid):
        self._lvm.zfs_format(jid, self.lv.path, self.lv.name,
            os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name))
        self.chown(jid)

    def mount(self, jid, mountpoint=None):
        self._lvm.zfs_mount(jid, self.lv.name)

    def unmount(self, jid):
        self._lvm.zfs_unmount(jid, self.lv.name)

    def destroy(self):
        self._lvm.zfs_destroy(self.lv.name)

    def online_resize_available(self, grow):
        return grow

    def resize(self, jid, grow):
        if not grow:
            raise SystemError("ZFS-Fuse does not support shrinking.")
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
            return self["mounted"] == "yes"
        except dbus.DBusException:
            return None

    def __getitem__(self, item):
        return dbus_to_python(self.lv.lvm.zfs_get(self.lv.name, item))[0][2]

    def __setitem__(self, item, value):
        dbus_to_python(self.lv.lvm.zfs_set(self.lv.name, item, str(value)))


class Ntfs(FileSystem):
    """ Handler for NTFS-3g. """
    name = "ntfs-3g"
    desc = "NTFS (Windows)"

    @property
    def info(self):
        return {}

    def format(self, jid):
        self._lvm.ntfs_format( jid, self.lv.path )
        self.mount(jid)
        self.chown(jid)

    def resize(self, jid, grow):
        self._lvm.ntfs_resize( jid, self.lv.path, self.lv.megs, grow )



FILESYSTEMS = (Ext2, Ext3, Ext4, Ntfs, Zfs)

def get_by_name(name):
    """ Return the file system class with the given ``name``. """
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
