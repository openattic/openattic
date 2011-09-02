# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os

from systemd  import dbus_to_python
from lvm.conf import settings as lvm_settings
from lvm      import signals  as lvm_signals

class FileSystem(object):
    name = "failfs"
    desc = "failing file system"

    def __init__(self, logical_volume):
        self.lv = logical_volume

    @property
    def mountpoints(self):
        return [os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name)]

    def mount(self, mountpoint=None):
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        lvm_signals.pre_mount.send(sender=self.lv, device=self.lv.path, mountpoint=mountpoint)
        try:
            return dbus_to_python(self.lv.lvm.fs_mount( self.name, self.lv.path, mountpoint ))
        finally:
            lvm_signals.post_mount.send(sender=self.lv, device=self.lv.path, mountpoint=mountpoint)

    @property
    def mounted(self, mountpoint=None):
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        return os.path.ismount(mountpoint)

    def unmount(self, mountpoint=None):
        if mountpoint is None and len(self.mountpoints) == 1:
            mountpoint = self.mountpoints[0]
        lvm_signals.pre_unmount.send(sender=self.lv, mountpoint=mountpoint)
        try:
            return dbus_to_python(self.lv.lvm.fs_unmount( self.lv.path, mountpoint ))
        finally:
            lvm_signals.post_unmount.send(sender=self.lv, mountpoint=mountpoint)

    def format(self):
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, grow):
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    @property
    def info(self):
        raise NotImplementedError("FileSystem::info needs to be overridden")

    def chown(self):
        for mp in self.mountpoints:
            ret = self.lv.lvm.fs_chown( mp, self.lv.owner.username, lvm_settings.CHOWN_GROUP )
            if ret != 0:
                return ret
        return 0

    @property
    def stat(self, mountpoint=None):
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
    name = "ext2"
    desc = "Ext2 (Linux)"

    @property
    def info(self):
        return dbus_to_python( self.lv.lvm.e2fs_info( self.lv.path ) )

    def format(self):
        return self.lv.lvm.e2fs_format( self.lv.path, self.lv.name )

    def resize(self, grow):
        if self.lv.lvm.e2fs_check( self.lv.path ) != 0:
            raise SystemError("File System is not clean, aborting.")
        return self.lv.lvm.e2fs_resize( self.lv.path, self.lv.megs )

class Ext3(Ext2):
    name = "ext3"
    desc = "Ext3 (Linux Journalling)"

    def format(self):
        return self.lv.lvm.e3fs_format( self.lv.path, self.lv.name )

class Ext4(Ext2):
    name = "ext4"
    desc = "Ext4 (Linux Journalling)"

    def format(self):
        return self.lv.lvm.e4fs_format( self.lv.path, self.lv.name )


class Ntfs(FileSystem):
    name = "ntfs"
    desc = "NTFS (Windows)"

    @property
    def info(self):
        return {}

    def format(self):
        return self.lv.lvm.ntfs_format( self.lv.path )

    def resize(self, grow):
        return self.lv.lvm.ntfs_resize( self.lv.path, self.lv.megs )



FILESYSTEMS = (Ext2, Ext3, Ext4, Ntfs)

def get_by_name(name):
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
