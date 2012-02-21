# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

    @property
    def mountpoints(self):
        """ Return a list of mount points. Currently, only the first one is used. """
        return [os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name)]

    def mount(self, mountpoint=None):
        """ Mount the file system at the given mountpoint, or the first one if
            mountpoint is omitted.
        """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        lvm_signals.pre_mount.send(sender=self.lv, device=self.lv.path, mountpoint=mountpoint)
        try:
            return dbus_to_python(self.lv.lvm.fs_mount( self.name, self.lv.path, mountpoint ))
        finally:
            lvm_signals.post_mount.send(sender=self.lv, device=self.lv.path, mountpoint=mountpoint)

    @property
    def mounted(self, mountpoint=None):
        """ True if the volume is currently mounted. """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        return os.path.ismount(mountpoint)

    def unmount(self, mountpoint=None):
        """ Unmount the volume. """
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        lvm_signals.pre_unmount.send(sender=self.lv, mountpoint=mountpoint)
        try:
            return dbus_to_python(self.lv.lvm.fs_unmount( self.lv.path, mountpoint ))
        finally:
            lvm_signals.post_unmount.send(sender=self.lv, mountpoint=mountpoint)

    def format(self):
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

    def chown(self):
        """ Change ownership of the filesystem to be the LV's owner. """
        for mp in self.mountpoints:
            ret = self.lv.lvm.fs_chown( mp, self.lv.owner.username, lvm_settings.CHOWN_GROUP )
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

    def format(self):
        return self.lv.lvm.e2fs_format( self.lv.path, self.lv.name,
            self.lv.owner.username, lvm_settings.CHOWN_GROUP, self.mountpoints[0] )

    def resize(self, jid, grow):
        if not grow:
            self.lv.lvm.e2fs_check( jid, self.lv.path )
        return self.lv.lvm.e2fs_resize( jid, self.lv.path, self.lv.megs, grow )

class Ext3(Ext2):
    """ Handler for Ext3 (Ext2 + Journal). """
    name = "ext3"
    desc = "Ext3 (Linux Journalling)"

    def format(self):
        return self.lv.lvm.e3fs_format( self.lv.path, self.lv.name,
            self.lv.owner.username, lvm_settings.CHOWN_GROUP, self.mountpoints[0] )

class Ext4(Ext2):
    """ Handler for ext4. """
    name = "ext4"
    desc = "Ext4 (Linux Journalling)"

    def format(self):
        return self.lv.lvm.e4fs_format( self.lv.path, self.lv.name,
            self.lv.owner.username, lvm_settings.CHOWN_GROUP, self.mountpoints[0] )


class Zfs(FileSystem):
    """ Handler for ZFS on Fuse. """
    name = "zfs"
    desc = "ZFS on FUSE"
    mount_in_fstab = False

    @property
    def info(self):
        return dbus_to_python(self.lv.lvm.zfs_get(self.lv.name, "all"))

    def format(self):
        return self.lv.lvm.zfs_format(self.lv.path, self.lv.name,
            self.lv.owner.username, lvm_settings.CHOWN_GROUP,
            os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name))

    def mount(self, mountpoint=None):
        return self.lv.lvm.zfs_mount(self.lv.name)

    def unmount(self):
        return self.lv.lvm.zfs_unmount(self.lv.name)

    def destroy(self):
        return self.lv.lvm.zfs_destroy(self.lv.name)

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

    def format(self):
        return self.lv.lvm.ntfs_format( self.lv.path,
            self.lv.owner.username, lvm_settings.CHOWN_GROUP, self.mountpoints[0] )

    def resize(self, grow):
        return self.lv.lvm.ntfs_resize( jid, self.lv.path, self.lv.megs, grow )



FILESYSTEMS = (Ext2, Ext3, Ext4, Ntfs, Zfs)

def get_by_name(name):
    """ Return the file system class with the given ``name``. """
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
