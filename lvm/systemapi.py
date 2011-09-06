# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
from systemd import invoke, logged, BasePlugin, method

from lvm.conf   import settings as lvm_settings
from lvm.models import LogicalVolume

def lvm_command(cmd):
    ret, out, err = invoke(
        [cmd, "--noheadings", "--nameprefixes", "--unquoted", "--units", "m"],
        return_out_err=True, log=lvm_settings.LOG_COMMANDS
        )

    if err:
        raise SystemError(err)

    return [
        dict( [ vardef.split('=', 1) for vardef in line.split(" ") if vardef ] )
        for line in out.split("\n") if line.strip()
        ]

def lvm_vgs():
    return dict( [ (lv["LVM2_VG_NAME"], lv) for lv in lvm_command("/sbin/vgs") ] )

def lvm_lvs():
    return dict( [ (lv["LVM2_LV_NAME"], lv) for lv in lvm_command("/sbin/lvs") ] )


@logged
class SystemD(BasePlugin):
    dbus_path = "/lvm"

    @method(in_signature="", out_signature="a{sa{ss}}")
    def vgs(self):
        return lvm_vgs()

    @method(in_signature="", out_signature="a{sa{ss}}")
    def lvs(self):
        return lvm_lvs()

    @method(in_signature="ssis", out_signature="i")
    def lvcreate(self, vgname, lvname, megs, snapshot):
        cmd = ["/sbin/lvcreate"]
        if snapshot:
            cmd.extend(["-s", snapshot])
        cmd.extend(["-L", ("%dM" % megs),
            '-n', lvname,
            vgname
            ])
        return invoke(cmd)

    @method(in_signature="sb", out_signature="i")
    def lvchange(self, device, active):
        return invoke(["/sbin/lvchange", ('-a' + {False: 'n', True: 'y'}[active]), device])

    @method(in_signature="si", out_signature="i")
    def lvresize(self, device, megs):
        return invoke(["/sbin/lvresize", '-L', ("%dM" % megs), device])

    @method(in_signature="s", out_signature="i")
    def lvremove(self, device):
        return invoke(["/sbin/lvremove", '-f', device])


    @method(in_signature="sss", out_signature="i")
    def fs_mount(self, fstype, devpath, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        return invoke(["/bin/mount", "-t", fstype, devpath, mountpoint])

    @method(in_signature="ss", out_signature="i")
    def fs_unmount(self, devpath, mountpoint):
        if not os.path.exists(mountpoint) or not os.path.ismount(mountpoint):
            return -1
        ret = invoke(["/bin/umount", mountpoint])
        if ret == 0 and os.path.exists(mountpoint):
            os.rmdir(mountpoint)
        return ret

    @method(in_signature="sss", out_signature="i")
    def fs_chown(self, mountpoint, user, group):
        if group:
            return invoke(["/bin/chown", "-R", ("%s:%s" % (user, group)), mountpoint])
        else:
            return invoke(["/bin/chown", "-R", user, mountpoint])

    @method(in_signature="s", out_signature="a{ss}")
    def e2fs_info(self, devpath):
        ret, out, err = invoke(["/sbin/tune2fs", "-l", devpath], return_out_err=True)
        return dict([ [part.strip() for part in line.split(":", 1)] for line in out.split("\n")[1:] if line ])

    @method(in_signature="ss", out_signature="i")
    def e2fs_format(self, devpath, label):
        return invoke(["/sbin/mke2fs", "-q", "-m0", "-L", label, devpath])

    @method(in_signature="s", out_signature="i")
    def e2fs_check(self, devpath):
        return invoke(["/sbin/e2fsck", "-y", "-f", devpath])

    @method(in_signature="si", out_signature="i")
    def e2fs_resize(self, devpath, megs):
        return invoke(["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @method(in_signature="ss", out_signature="i")
    def e3fs_format(self, devpath, label):
        return invoke(["/sbin/mke2fs", "-q", "-j", "-m0", "-L", label, devpath])

    @method(in_signature="ss", out_signature="i")
    def e4fs_format(self, devpath, label):
        return invoke(["/sbin/mkfs.ext4", "-q", "-m0", "-L", label, devpath])

    @method(in_signature="s", out_signature="i")
    def ntfs_format(self, devpath):
        return invoke(["/sbin/mkntfs", "--fast", devpath])

    @method(in_signature="si", out_signature="i")
    def ntfs_resize(self, devpath, megs):
        return invoke(["/sbin/ntfsresize", "--force", "--size", ("%dM" % megs), devpath], stdin="y\n")

    @method(in_signature="", out_signature="a{ss}")
    def modprobe_dmsnapshot_version(self):
        invoke(["/sbin/modprobe", "dm-snapshot"])
        ret, out, err = invoke(["/sbin/dmsetup", "targets"], return_out_err=True)
        if ret != 0:
            raise SystemError("dmsetup targets failed: " + err)
        return dict([ line.split() for line in out.split("\n") if line.strip()])

    @method(in_signature="", out_signature="i")
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

        for lv in LogicalVolume.objects.filter(filesystem__isnull=False):
            newlines.append( "%-50s %-50s %-8s %s %d %d" % (
                lv.path, lv.fs.mountpoints[0], lv.fs.name, "defaults", 0, 0
                ) )

        fstab = open("/etc/fstab", "wb")
        try:
            for line in newlines:
                fstab.write( line + "\n" )
        finally:
            fstab.close()

        return True
