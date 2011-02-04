# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
from procutils import invoke

from lvm.conf import settings as lvm_settings

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

        return os.path.join(lvm_settings.MOUNT_PREFIX, self.lv.vg.name, self.lv.name)

    def mount(self):
        if not os.path.exists(self.mountpoint):
            os.makedirs(self.mountpoint)
        invoke(["/bin/mount", "-t", self.name, self.lv.path, self.mountpoint])

    def unmount(self):
        invoke(["/bin/umount", self.lv.path])
        if os.path.exists(self.mountpoint):
            os.rmdir(self.mountpoint)

    def format(self):
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, grow):
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    def chown(self):
        if lvm_settings.CHOWN_GROUP:
            invoke(["/bin/chown", "-R", (
                "%s:%s" % (self.lv.owner.username, lvm_settings.CHOWN_GROUP)
                ), self.mountpoint])
        else:
            invoke(["/bin/chown", "-R", self.lv.owner.username, self.mountpoint])


class Ext2(FileSystem):
    name = "ext2"
    desc = "Ext2 (Linux)"
    mountable = True

    def format(self):
        invoke(["/sbin/mke2fs", "-L", self.lv.name, self.lv.path])

    def resize(self, grow):
        invoke(["/sbin/e2fsck", "-y", "-f", self.lv.path])
        invoke(["/sbin/resize2fs", self.lv.path, ("%dM" % self.lv.megs)])

class Ext3(Ext2):
    name = "ext3"
    desc = "Ext3 (Linux Journalling)"
    mountable = True

    def format(self):
        invoke(["/sbin/mke2fs", "-L", self.lv.name, "-j", self.lv.path])

class Ntfs(FileSystem):
    name = "ntfs"
    desc = "NTFS (Windows)"
    mountable = True

    def format(self):
        invoke(["/usr/sbin/mkntfs", "--fast", self.lv.path])

    def resize(self, grow):
        invoke(["/usr/sbin/ntfsresize", "--size", ("%dM" % self.lv.megs), self.lv.path])

class Qcow2(FileSystem):
    name = "qcow2"
    desc = "QCOW2 (Virtualization)"

    def format(self):
        invoke(["/usr/bin/qemu-img", "create", "-f", "qcow2", self.lv.path])

    def resize(self, grow):
        invoke(["/usr/bin/qemu-img", self.lv.path, ("%dM" % self.lv.megs)])


FILESYSTEMS = (Ext2, Ext3, Ntfs, Qcow2)

def get_by_name(name):
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
