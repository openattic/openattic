# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
from procutils import invoke

class FileSystem(object):
    name = "failfs"
    desc = "failing file system"
    mountable = False

    def __init__(self, logical_volume):
        self.lv = logical_volume

    @property
    def mountpoint(self):
        if not self.mountable:
            raise SystemError("File System type '%s' is not mountable" % self.name)

        return os.path.join("/media", self.lv.vg.name, self.lv.name)

    def mount(self):
        if not os.path.exists(self.mountpoint):
            os.makedirs(self.mountpoint)
        invoke(["mount", "-t", self.name, self.lv.path, self.mountpoint])

    def unmount(self):
        invoke(["umount", self.lv.path])
        if os.path.exists(self.mountpoint):
            os.rmdir(self.mountpoint)

    def format(self):
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self):
        raise NotImplementedError("FileSystem::resize needs to be overridden")


class Ext2(FileSystem):
    name = "ext2"
    desc = "Ext2 (Linux)"
    mountable = True

    def format(self):
        invoke(["mke2fs", "-L", self.lv.name, self.lv.path])

class Ext3(Ext2):
    name = "ext3"
    desc = "Ext3 (Linux Journalling)"
    mountable = True

    def format(self):
        invoke(["mke2fs", "-L", self.lv.name, "-j", self.lv.path])

class Ntfs(FileSystem):
    name = "ntfs"
    desc = "NTFS (Windows)"
    mountable = True

    def format(self):
        invoke(["mkntfs", self.lv.path])

class Qcow2(FileSystem):
    name = "qcow2"
    desc = "QCOW2 (Virtualization)"

    def format(self):
        invoke(["qemu-img", "create", "-f", "qcow2", self.lv.path])


FILESYSTEMS = (Ext2, Ext3, Ntfs, Qcow2)

def get_by_name(name):
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
