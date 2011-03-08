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

    @property
    def mounted(self):
        return os.path.ismount(self.mountpoint)

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

    @property
    def stat(self):
        s = os.statvfs(self.mountpoint)
        return {
            'size': (s.f_blocks * s.f_frsize) / 1024 / 1000.,
            'free': (s.f_bavail * s.f_frsize) / 1024 / 1000.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024 / 1000.,
            }

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

class Ext4(Ext2):
    name = "ext4"
    desc = "Ext4 (Linux Journalling)"
    mountable = True

    def format(self):
        invoke(["/sbin/mkfs.ext4", "-L", self.lv.name, self.lv.path])


class Ntfs(FileSystem):
    name = "ntfs"
    desc = "NTFS (Windows)"
    mountable = True

    def format(self):
        invoke(["/usr/sbin/mkntfs", "--fast", self.lv.path])

    def resize(self, grow):
        import sys
        import subprocess
        from signal import signal, SIGTERM, SIGINT, SIG_DFL

        proc = subprocess.Popen(
            ["/usr/sbin/ntfsresize", "--force", "--size", ("%dM" % self.lv.megs), self.lv.path],
            stdin  = subprocess.PIPE, stdout = sys.stdout, stderr = sys.stderr
            )

        def fwdsigterm(signum, frame):
            proc.send_signal(SIGTERM)
            signal(SIGTERM, fwdsigterm)

        signal(SIGTERM, fwdsigterm)
        signal(SIGINT, fwdsigterm)
        proc.communicate("y\n")
        signal(SIGTERM, SIG_DFL)
        signal(SIGINT, SIG_DFL)



class Qcow2(FileSystem):
    name = "qcow2"
    desc = "QCOW2 (Virtualization)"

    def format(self):
        invoke(["/usr/bin/qemu-img", "create", "-f", "qcow2", self.lv.path])

    def resize(self, grow):
        invoke(["/usr/bin/qemu-img", "resize", self.lv.path, ("%dM" % self.lv.megs)])


FILESYSTEMS = (Ext2, Ext3, Ext4, Ntfs, Qcow2)

def get_by_name(name):
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise AttributeError("No such filesystem found: '%s'" % name)
