# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
from procutils import invoke

from lvm.conf import settings as lvm_settings

class FileSystem(object):
    name = "failfs"
    desc = "failing file system"

    def __init__(self, logical_volume):
        self.lv = logical_volume

    @property
    def mountpoint(self):
        return os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name)

    def mount(self):
        return self.lv.lvm.fs_mount( self.name, self.lv.path, self.mountpoint )

    @property
    def mounted(self):
        return os.path.ismount(self.mountpoint)

    def unmount(self):
        return self.lv.lvm.fs_unmount( self.lv.path, self.mountpoint )

    def format(self):
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, grow):
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    def chown(self):
        return self.lv.lvm.fs_chown( self.mountpoint, self.lv.owner.username, lvm_settings.CHOWN_GROUP )

    @property
    def stat(self):
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

class Ext2(FileSystem):
    name = "ext2"
    desc = "Ext2 (Linux)"

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
