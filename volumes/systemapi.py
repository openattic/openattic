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
from systemd import invoke, logged, BasePlugin, method, signal

from volumes.models import VolumePool, FileSystemProvider
from volumes import capabilities

@logged
class SystemD(BasePlugin):
    dbus_path = "/volumes"

    @method(in_signature="isss", out_signature="")
    def fs_mount(self, jid, fstype, devpath, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        cmd = ["/bin/mount", "-t", fstype, devpath, mountpoint]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="iss", out_signature="")
    def fs_unmount(self, jid, devpath, mountpoint):
        if not os.path.exists(mountpoint) or not os.path.ismount(mountpoint):
            return
        cmd = ["/bin/umount", mountpoint]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="isss", out_signature="")
    def fs_chown(self, jid, mountpoint, user, group):
        if group:
            cmd = ["/bin/chown", "-R", ("%s:%s" % (user, group)), mountpoint]
        else:
            cmd = ["/bin/chown", "-R", user, mountpoint]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="s", out_signature="a{ss}")
    def e2fs_info(self, devpath):
        ret, out, err = invoke(["/sbin/tune2fs", "-l", devpath], return_out_err=True)
        return dict([ [part.strip() for part in line.split(":", 1)] for line in out.split("\n")[1:] if line ])

    @method(in_signature="issii", out_signature="")
    def e2fs_format(self, jid, devpath, label, chunksize, datadisks):
        cmd = ["/sbin/mke2fs"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-m0", "-L", label, devpath ])
        self.job_add_command(jid, cmd)

    @method(in_signature="is", out_signature="")
    def e2fs_check(self, jid, devpath):
        self.job_add_command(jid, ["/sbin/e2fsck", "-y", "-f", devpath])

    @method(in_signature="isib", out_signature="")
    def e2fs_resize(self, jid, devpath, megs, grow):
        self.job_add_command(jid, ["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @method(in_signature="issii", out_signature="")
    def e3fs_format(self, jid, devpath, label, chunksize, datadisks):
        cmd = ["/sbin/mke2fs"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-j", "-m0", "-L", label, devpath ])
        self.job_add_command(jid, cmd)

    @method(in_signature="issii", out_signature="")
    def e4fs_format(self, jid, devpath, label, chunksize, datadisks):
        cmd = ["/sbin/mkfs.ext4"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-m0", "-L", label, devpath ])
        self.job_add_command(jid, cmd)

    @method(in_signature="isiii", out_signature="")
    def xfs_format(self, jid, devpath, chunksize, datadisks, agcount):
        cmd = ["mkfs.xfs"]
        if chunksize != -1 and datadisks != -1:
            cmd.extend([
                "-d", "su=%dk" % (chunksize / 1024),
                "-d", "sw=%d" % datadisks,
                ])
        cmd.extend([ "-d", "agcount=%d" % agcount, devpath ])
        self.job_add_command(jid, cmd)

    @method(in_signature="isi", out_signature="")
    def xfs_resize(self, jid, mountpoint, megs):
        self.job_add_command(jid, ["xfs_growfs", mountpoint])

    @method(in_signature="isi", out_signature="")
    def ocfs2_format(self, jid, devpath, chunksize):
        cmd = ["mkfs.ocfs2", '-b', '4096', '-T', 'vmstore']
        if chunksize != -1:
            cmd.extend(["-C", "%dK" % (chunksize / 1024)])
        cmd.append(devpath)
        self.job_add_command(jid, cmd)

    @method(in_signature="", out_signature="")
    def write_fstab(self):
        # read current fstab
        fd = open( "/etc/fstab", "rb" )
        try:
            fstab = fd.read()
        finally:
            fd.close()

        delim = "# # openATTIC mounts. Insert your own before this line. # #"

        # find lines at the beginning that need to be kept
        newlines = []
        for line in fstab.split("\n"):
            if line == delim:
                break
            newlines.append(line)

        newlines.append(delim)

        for obj in VolumePool.objects.all():
            if    capabilities.FileSystemCapability   in obj.capabilities \
              and capabilities.HandlesMountCapability not in obj.capabilities:
                for member in obj.member_set.all():
                    newlines.append( "%-50s %-50s %-8s %s %d %d" % (
                        member.path, obj.fs.path, obj.fs.name, "defaults", 0, 0
                        ) )

        for obj in FileSystemProvider.objects.all():
            newlines.append( "%-50s %-50s %-8s %s %d %d" % (
                obj.base.volume.path, obj.path, obj.type, "defaults", 0, 0
                ) )

        fstab = open("/tmp/fstab", "wb")
        try:
            for line in newlines:
                fstab.write( line + "\n" )
        finally:
            fstab.close()


