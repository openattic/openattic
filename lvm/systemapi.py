# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
from systemd import invoke, create_job, logged, BasePlugin, method, signal

from lvm.conf   import settings as lvm_settings
from lvm.models import LogicalVolume

def lvm_command(cmd):
    ret, out, err = invoke(
        (cmd + ["--noheadings", "--nameprefixes", "--unquoted", "--units", "m"]),
        return_out_err=True, log=lvm_settings.LOG_COMMANDS
        )

    if err and err.strip() != "No volume groups found":
        raise SystemError(err)

    return [
        dict( [ vardef.split('=', 1) for vardef in line.split(" ") if vardef ] )
        for line in out.split("\n") if line.strip()
        ]

def lvm_pvs():
    return dict( [ (lv["LVM2_PV_NAME"], lv) for lv in lvm_command(["/sbin/pvs"]) ] )

def lvm_vgs():
    info = dict( [ (lv["LVM2_VG_NAME"], lv) for lv in lvm_command(["/sbin/vgs"]) ] )
    for field in ("LVM2_VG_SIZE", "LVM2_VG_FREE"):
        for vg in info:
            info[vg][field] = info[vg][field][:-1] # cut off the m from 13.37m
    return info

def lvm_lvs():
    info = dict( [ (lv["LVM2_LV_NAME"], lv) for lv in lvm_command(["/sbin/lvs", '-o', '+seg_pe_ranges,lv_kernel_minor,lv_minor']) ] )
    for lv in info:
        info[lv]["LVM2_LV_SIZE"] = info[lv]["LVM2_LV_SIZE"][:-1] # cut off the m from 13.37m
    return info


@logged
class SystemD(BasePlugin):
    dbus_path = "/lvm"

    @method(in_signature="", out_signature="a{sa{ss}}")
    def pvs(self):
        return lvm_pvs()

    @method(in_signature="", out_signature="a{sa{ss}}")
    def vgs(self):
        return lvm_vgs()

    @method(in_signature="", out_signature="a{sa{ss}}")
    def lvs(self):
        return lvm_lvs()

    @method(in_signature="ss", out_signature="i")
    def join_device_to_vg(self, device, vgname):
        devpath = os.path.join("/dev", device)
        invoke(["/sbin/pvcreate", devpath])
        if vgname in lvm_vgs():
            return invoke(["/sbin/vgextend", vgname, devpath])
        else:
            return invoke(["/sbin/vgcreate", vgname, devpath])

    @method(in_signature="ssis", out_signature="i")
    def lvcreate(self, vgname, lvname, megs, snapshot):
        cmd = ["/sbin/lvcreate"]
        if snapshot:
            cmd.extend(["-s", snapshot])
        cmd.extend(["-L", ("%dM" % megs),
            '-n', lvname,
            ])
        if not snapshot:
            cmd.append(vgname)
        return invoke(cmd)

    @method(in_signature="sb", out_signature="i")
    def lvchange(self, device, active):
        return invoke(["/sbin/lvchange", ('-a' + {False: 'n', True: 'y'}[active]), device])

    @method(in_signature="isib", out_signature="")
    def lvresize(self, jid, device, megs, grow):
        if not grow:
            self.job_add_command(jid, ["/sbin/lvchange", '-an', device])

        self.job_add_command(jid, ["/sbin/lvresize", '-L', ("%dM" % megs), device])

        if not grow:
            self.job_add_command(jid, ["/sbin/lvchange", '-ay', device])

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

    @method(in_signature="sssss", out_signature="")
    def e2fs_format(self, devpath, label, chown, chgrp, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        create_job([
            ["/sbin/mke2fs", "-q", "-m0", "-L", label, devpath],
            ["/bin/mount", "-t", "ext2", devpath, mountpoint],
            ["/bin/chown", "-R", ("%s:%s" % (chown, chgrp)), mountpoint]
            ], self.format_complete, (devpath, mountpoint, "ext2"))

    @method(in_signature="s", out_signature="i")
    def e2fs_check(self, devpath):
        return invoke(["/sbin/e2fsck", "-y", "-f", devpath])

    @method(in_signature="isib", out_signature="")
    def e2fs_resize(self, jid, devpath, megs, grow):
        self.job_add_command(jid, ["/sbin/e2fsck", "-f", "-y", devpath])
        self.job_add_command(jid, ["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @method(in_signature="sssss", out_signature="")
    def e3fs_format(self, devpath, label, chown, chgrp, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        create_job([
            ["/sbin/mke2fs", "-q", "-j", "-m0", "-L", label, devpath],
            ["/bin/mount", "-t", "ext3", devpath, mountpoint],
            ["/bin/chown", "-R", ("%s:%s" % (chown, chgrp)), mountpoint]
            ], self.format_complete, (devpath, mountpoint, "ext3"))

    @method(in_signature="sssss", out_signature="")
    def e4fs_format(self, devpath, label, chown, chgrp, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        create_job([
            ["/sbin/mkfs.ext4", "-q", "-m0", "-L", label, devpath],
            ["/bin/mount", "-t", "ext4", devpath, mountpoint],
            ["/bin/chown", "-R", ("%s:%s" % (chown, chgrp)), mountpoint]
            ], self.format_complete, (devpath, mountpoint, "ext4"))

    @method(in_signature="ssss", out_signature="")
    def ntfs_format(self, devpath, chown, chgrp, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        create_job([
            ["/sbin/mkntfs", "--fast", devpath],
            ["/bin/mount", "-t", "ntfs-3g", devpath, mountpoint],
            ["/bin/chown", "-R", ("%s:%s" % (chown, chgrp)), mountpoint]
            ], self.format_complete, (devpath, mountpoint, "ntfs-3g"))

    @signal(signature="sss")
    def format_complete(self, devpath, mountpoint, fstype):
        pass

    @method(in_signature="isib", out_signature="")
    def ntfs_resize(self, jid, devpath, megs, grow):
        self.job_add_command(jid, ["/sbin/ntfsresize", "--force", "--size", ("%dM" % megs), devpath], stdin="y\n")

    @method(in_signature="", out_signature="a{ss}")
    def modprobe_dmsnapshot_version(self):
        invoke(["/sbin/modprobe", "dm-snapshot"])
        ret, out, err = invoke(["/sbin/dmsetup", "targets"], return_out_err=True)
        if ret != 0:
            raise SystemError("dmsetup targets failed: " + err)
        return dict([ line.split() for line in out.split("\n") if line.strip()])

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

        for lv in LogicalVolume.objects.filter(filesystem__isnull=False).exclude(filesystem=""):
            if lv.fs.mount_in_fstab:
                newlines.append( "%-50s %-50s %-8s %s %d %d" % (
                    lv.path, lv.fs.mountpoints[0], lv.fs.name, "defaults", 0, 0
                    ) )

        fstab = open("/etc/fstab", "wb")
        try:
            for line in newlines:
                fstab.write( line + "\n" )
        finally:
            fstab.close()

    @method(in_signature="s", out_signature="ia{ss}aa{ss}")
    def get_partitions(self, device):
        from systemd.procutils import invoke

        ret, out, err = invoke(["parted", "-s", "-m", device, "unit", "MB", "print"], return_out_err=True, log=False)

        lines = out.split("\n")
        splittedlines = []
        for line in lines:
            if line:
                # lines end with ";", strip that before splitting
                splittedlines.append( line[:-1].split(":") )

        partitions = []
        for currentline in splittedlines[2:]:
            partitions.append({
                "number":currentline[0] ,
                "begin":currentline[1],
                "end":currentline[2],
                "size":currentline[3],
                "filesystem-type":currentline[4],
                "partition-name":currentline[5],
                "flags-set":currentline[6],
                })
        return ret, {
            "path": splittedlines[1][0],
            "size":splittedlines[1][1],
            "transport-type": splittedlines[1][2],
            "logical-sector-size": splittedlines[1][3],
            "physical-sector-size":splittedlines[1][4],
            "partition-table-type":splittedlines[1][5],
            "model-name":splittedlines[1][6],
            }, partitions


    @method(in_signature="ss", out_signature="a(ssss)")
    def zfs_get(self, device, field):
        ret, out, err = invoke(["zfs", "get", "-H", field, device], return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @method(in_signature="sss", out_signature="i")
    def zfs_set(self, device, field, value):
        return invoke(["zfs", "set", ("%s=%s" % (field, value)), device])

    @method(in_signature="s", out_signature="i")
    def zfs_mount(self, device):
        return invoke(["zfs", "mount", device])

    @method(in_signature="s", out_signature="i")
    def zfs_unmount(self, device):
        return invoke(["zfs", "unmount", device])

    @method(in_signature="s", out_signature="i")
    def zfs_destroy(self, device):
        return invoke(["zpool", "destroy", device])

    @method(in_signature="sssss", out_signature="")
    def zfs_format(self, devpath, label, chown, chgrp, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        create_job([
            ["zpool", "create", "-m", mountpoint, label, devpath],
            ["/bin/chown", "-R", ("%s:%s" % (chown, chgrp)), mountpoint]
            ], self.format_complete, (devpath, mountpoint, "zfs"))

    @method(in_signature="ss", out_signature="i")
    def zfs_create_volume(self, pool, volume):
        return invoke(["zfs", "create", "%s/%s" % (pool, volume)])

    @method(in_signature="ss", out_signature="i")
    def zfs_destroy_volume(self, pool, volume):
        return invoke(["zfs", "destroy", "%s/%s" % (pool, volume)])

    @method(in_signature="ss", out_signature="i")
    def zfs_create_snapshot(self, orig, snapshot):
        invoke(["zfs", "snapshot", "%s@%s" % (orig, snapshot)])
        return invoke(["zfs", "clone",
            "%s@%s" % (orig, snapshot),
            "%s/.%s" % (orig, snapshot)
            ])

    @method(in_signature="ss", out_signature="i")
    def zfs_destroy_snapshot(self, orig, snapshot):
        return invoke(["zfs", "destroy", "-R", "%s@%s" % (orig, snapshot)])

    @method(in_signature="ss", out_signature="i")
    def zfs_rollback_snapshot(self, orig, snapshot):
        return invoke(["zfs", "rollback", "-R", "%s@%s" % (orig, snapshot)])

    @method(in_signature="s", out_signature="a(sssssss)")
    def zfs_getspace(self, device):
        args = ["zfs", "list", "-Ho", "space"]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

