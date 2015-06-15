# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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
import os.path
from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method, signal, deferredmethod

from volumes.conf import settings as volumes_settings
from volumes.models import StorageObject, VolumePool, BlockVolume, FileSystemVolume
from volumes import capabilities

@logged
class SystemD(BasePlugin):
    dbus_path = "/volumes"

    @deferredmethod(in_signature="ssss")
    def dd(self, infile, outfile, count, bs, sender):
        invoke(['/bin/dd', 'if=%s' % infile, 'of=%s' % outfile,
                'count=%s' % count, 'bs=%s' % bs,
                'conv=fdatasync'])

    @deferredmethod(in_signature="sssas")
    def fs_mount(self, fstype, devpath, mountpoint, options, sender):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        if options:
            options = ["-o", ",".join(options)]
        else:
            options = []
        invoke(["/bin/mount", "-t", fstype] + options + [devpath, mountpoint])

    @deferredmethod(in_signature="ss")
    def fs_unmount(self, devpath, mountpoint, sender):
        if not os.path.exists(mountpoint) or not os.path.ismount(mountpoint):
            return
        invoke(["/bin/umount", mountpoint])
        os.rmdir(mountpoint)

    @deferredmethod(in_signature="sss")
    def fs_chown(self, mountpoint, user, group, sender):
        if group:
            cmd = ["/bin/chown", "-R", ("%s:%s" % (user, group)), mountpoint]
        else:
            cmd = ["/bin/chown", "-R", user, mountpoint]
        invoke(cmd)

    @method(in_signature="s", out_signature="a{sd}")
    def fs_stat(self, mountpoint):
        if not os.path.ismount(mountpoint):
            raise SystemError("not mounted")
        s = os.statvfs(mountpoint)
        stats = {
            'size': (s.f_blocks * s.f_frsize) / 1024. / 1024.,
            'free': (s.f_bavail * s.f_frsize) / 1024. / 1024.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024. / 1024.,
            }
        return stats

    @method(in_signature="s", out_signature="a{ss}")
    def e2fs_info(self, devpath):
        ret, out, err = invoke(["/sbin/tune2fs", "-l", devpath], return_out_err=True)
        return dict([ [part.strip() for part in line.split(":", 1)] for line in out.split("\n")[1:] if line ])

    @deferredmethod(in_signature="ssii")
    def e2fs_format(self, devpath, label, chunksize, datadisks, sender):
        cmd = ["/sbin/mke2fs"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-m0", "-L", label, devpath ])
        invoke(cmd)

    @deferredmethod(in_signature="s")
    def e2fs_check(self, devpath, sender):
        invoke(["/sbin/e2fsck", "-y", "-f", devpath])

    @deferredmethod(in_signature="sib")
    def e2fs_resize(self, devpath, megs, grow, sender):
        invoke(["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @deferredmethod(in_signature="ss")
    def e2fs_set_uuid(self, devpath, uuid, sender):
        invoke(["/sbin/tune2fs", "-U", uuid, devpath])

    @deferredmethod(in_signature="ssii")
    def e3fs_format(self, devpath, label, chunksize, datadisks, sender):
        cmd = ["/sbin/mke2fs"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-j", "-m0", "-L", label, devpath ])
        invoke(cmd)

    @deferredmethod(in_signature="ssii")
    def e4fs_format(self, devpath, label, chunksize, datadisks, sender):
        cmd = ["/sbin/mkfs.ext4"]
        if chunksize != -1 and datadisks != -1:
            stride = chunksize / 4096
            stripe_width = stride * datadisks
            cmd.extend([ "-E", "stride=%d,stripe_width=%d" % (stride, stripe_width) ])
        cmd.extend([ "-q", "-m0", "-L", label, devpath ])
        invoke(cmd)

    @deferredmethod(in_signature="siii")
    def xfs_format(self, devpath, chunksize, datadisks, agcount, sender):
        cmd = ["mkfs.xfs"]
        if chunksize != -1 and datadisks != -1:
            cmd.extend([
                "-d", "su=%dk" % (chunksize / 1024),
                "-d", "sw=%d" % datadisks,
                ])
        cmd.extend([ "-d", "agcount=%d" % agcount, devpath ])
        invoke(cmd)

    @deferredmethod(in_signature="si")
    def xfs_resize(self, mountpoint, megs, sender):
        invoke(["xfs_growfs", mountpoint])

    @deferredmethod(in_signature="ss")
    def xfs_set_uuid(self, devpath, uuid, sender):
        invoke(["/usr/sbin/xfs_admin", "-U", uuid, devpath])

    @deferredmethod(in_signature="")
    def write_fstab(self, sender):
        # read current fstab
        with open( "/etc/fstab", "rb" ) as fstab:

            delim = "# # openATTIC mounts. Insert your own before this line. # #"

            # find lines at the beginning that need to be kept
            newlines = []
            for line in fstab:
                line = line.strip("\n")
                if line == delim:
                    break
                newlines.append(line)

            newlines.append(delim)

            for obj in StorageObject.objects.all():
                try:
                    if not hasattr(obj.filesystemvolume.volume, "fstype"):
                        continue
                    newlines.append( "%-50s %-50s %-8s %s %d %d" % (
                        obj.blockvolume.volume.path, obj.filesystemvolume.volume.path, obj.filesystemvolume.volume.fstype, "defaults", 0, 0
                        ) )
                except (BlockVolume.DoesNotExist, FileSystemVolume.DoesNotExist):
                    pass

            delim = "# # openATTIC mounts. Insert your own after this line. # #"
            delimfound = False

            # find lines at the end that need to be kept
            for line in fstab:
                line = line.strip("\n")
                if line != delim and not delimfound:
                    continue
                delimfound = True
                newlines.append(line)

            if not delimfound:
                newlines.append(delim)

        with open( "/etc/fstab", "wb" ) as fstab:
            for line in newlines:
                fstab.write( line + "\n" )

    @method(in_signature="ss", out_signature="i")
    def run_initscript(self, script, path):
        if script.startswith("/"):
            script = script[1:]
        scpath = os.path.join(volumes_settings.VOLUME_INITD, script)
        return invoke([scpath, "initialize", path])

    @method(in_signature="s", out_signature="s")
    def get_type(self, device):
        ret, out, err = invoke(["file", "-sL", device], return_out_err=True)
        dev, info = out.split(":", 1)
        return info.strip()

    @deferredmethod(in_signature="sb")
    def set_identify(self, identify_path, state, sender):
        with open(identify_path, "w") as fd:
            fd.write(str(int(bool(state))))
