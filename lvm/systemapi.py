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
from time import time
from systemd import invoke, logged, BasePlugin, method, signal

from lvm.conf   import settings as lvm_settings
from lvm.models import LogicalVolume

def lvm_command(cmd):
    ret, out, err = invoke(
        (cmd + ["--noheadings", "--nameprefixes", "--units", "m"]),
        return_out_err=True, log=lvm_settings.LOG_COMMANDS
        )

    if err and err.strip() != "No volume groups found":
        raise SystemError(err)

    ST_VARNAME, ST_DELIM, ST_VALUE = range(3)
    state = ST_VARNAME

    result   = []
    currvar  = ""
    valbuf   = ""
    currdata = {}
    for char in out:
        if state == ST_VARNAME:
            if char == '=':
                state = ST_DELIM
            elif char == '\n':
                result.append(currdata)
                currdata = {}
            elif char in ('\t', '\r', ' '):
                continue
            else:
                currvar += char

        elif state == ST_DELIM:
            if char == "'":
                state = ST_VALUE
            else:
                raise ValueError("Expected \"'\", found \"%s\"" % char)

        elif state == ST_VALUE:
            if char == "'":
                state = ST_VARNAME
                currdata[currvar] = valbuf
                currvar = ""
                valbuf  = ""
            else:
                valbuf += char

    return result

def lvm_pvs():
    info = dict( [ (lv["LVM2_PV_NAME"], lv) for lv in lvm_command(["/sbin/pvs"]) ] )
    for field in ("LVM2_PV_SIZE", "LVM2_PV_FREE"):
        for pv in info:
            info[pv][field] = info[pv][field][:-1] # cut off the m from 13.37m
    return info

def lvm_vgs():
    info = dict( [ (lv["LVM2_VG_NAME"], lv) for lv in lvm_command(["/sbin/vgs"]) ] )
    for field in ("LVM2_VG_SIZE", "LVM2_VG_FREE"):
        for vg in info:
            info[vg][field] = info[vg][field][:-1] # cut off the m from 13.37m
    return info

def lvm_lvs():
    info = dict( [ (lv["LVM2_LV_NAME"], lv) for lv in lvm_command(["/sbin/lvs", '-o', '+seg_pe_ranges,lv_kernel_minor,lv_minor,uuid,lv_tags']) ] )
    for lv in info:
        info[lv]["LVM2_LV_SIZE"] = info[lv]["LVM2_LV_SIZE"][:-1] # cut off the m from 13.37m
    return info


@logged
class SystemD(BasePlugin):
    dbus_path = "/lvm"

    def __init__(self, bus, busname, mainobj):
        BasePlugin.__init__(self, bus, busname, mainobj)
        self.pvs_cache = None
        self.vgs_cache = None
        self.lvs_cache = None
        self.pvs_time  = 0
        self.vgs_time  = 0
        self.lvs_time  = 0

    @method(in_signature="", out_signature="a{sa{ss}}")
    def pvs(self):
        if( time() - self.pvs_time > lvm_settings.SYSD_INFO_TTL ):
            self.pvs_time = time()
            self.pvs_cache = lvm_pvs()
        return self.pvs_cache

    @method(in_signature="", out_signature="a{sa{ss}}")
    def vgs(self):
        if( time() - self.vgs_time > lvm_settings.SYSD_INFO_TTL ):
            self.vgs_time = time()
            self.vgs_cache = lvm_vgs()
        return self.vgs_cache

    @method(in_signature="", out_signature="a{sa{ss}}")
    def lvs(self):
        if( time() - self.lvs_time > lvm_settings.SYSD_INFO_TTL ):
            self.lvs_time = time()
            self.lvs_cache = lvm_lvs()
        return self.lvs_cache

    @method(in_signature="ss", out_signature="i")
    def join_device_to_vg(self, device, vgname):
        devpath = os.path.join("/dev", device)
        invoke(["/sbin/parted", devpath, "-s", "mklabel", "gpt"])
        invoke(["/sbin/parted", devpath, "--script", "--", "mkpart", "primary", "2048s", "-1"])
        devpath += "1"
        invoke(["/sbin/pvcreate", devpath])
        self.pvs_time = 0
        self.lvs_time = 0
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
        self.lvs_time = 0
        return invoke(cmd)

    @method(in_signature="sb", out_signature="i")
    def lvchange(self, device, active):
        self.lvs_time = 0
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
        self.lvs_time = 0
        return invoke(["/sbin/lvremove", '-f', device])

    @method(in_signature="s", out_signature="i")
    def vgremove(self, device):
        self.vgs_time = 0
        return invoke(["/sbin/vgremove", '-f', device])

    @method(in_signature="s", out_signature="i")
    def pvremove(self, device):
        self.pvs_time = 0
        return invoke(["/sbin/pvremove", '-f', device])


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

    @method(in_signature="iss", out_signature="")
    def e2fs_format(self, jid, devpath, label):
        self.job_add_command(jid, ["/sbin/mke2fs", "-q", "-m0", "-L", label, devpath])

    @method(in_signature="is", out_signature="")
    def e2fs_check(self, jid, devpath):
        self.job_add_command(jid, ["/sbin/e2fsck", "-y", "-f", devpath])

    @method(in_signature="isib", out_signature="")
    def e2fs_resize(self, jid, devpath, megs, grow):
        self.job_add_command(jid, ["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @method(in_signature="iss", out_signature="")
    def e3fs_format(self, jid, devpath, label):
        self.job_add_command(jid, ["/sbin/mke2fs", "-q", "-j", "-m0", "-L", label, devpath])

    @method(in_signature="iss", out_signature="")
    def e4fs_format(self, jid, devpath, label):
        self.job_add_command(jid, ["/sbin/mkfs.ext4", "-q", "-m0", "-L", label, devpath])

    @method(in_signature="is", out_signature="")
    def ntfs_format(self, jid, devpath):
        self.job_add_command(jid, ["/sbin/mkntfs", "--fast", devpath])

    @signal(signature="sss")
    def format_complete(self, devpath, mountpoint, fstype):
        pass

    @method(in_signature="isib", out_signature="")
    def ntfs_resize(self, jid, devpath, megs, grow):
        # TODO: Sometimes ntfsresize asks for confirmation interactively, how do we handle that?
        self.job_add_command(jid, ["/sbin/ntfsresize", "--force", "--size", ("%dM" % megs), devpath])

    @method(in_signature="isi", out_signature="")
    def xfs_format(self, jid, devpath, agcount):
        self.job_add_command(jid, ["mkfs.xfs", "-d", "agcount=%d" % agcount, devpath])

    @method(in_signature="isi", out_signature="")
    def xfs_resize(self, jid, mountpoint, megs):
        # TODO: Sometimes ntfsresize asks for confirmation interactively, how do we handle that?
        self.job_add_command(jid, ["xfs_growfs", mountpoint])

    @method(in_signature="", out_signature="a{ss}")
    def get_capabilities(self):
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
                    lv.path, lv.mountpoint, lv.fs.name, "defaults", 0, 0
                    ) )

        fstab = open("/etc/fstab", "wb")
        try:
            for line in newlines:
                fstab.write( line + "\n" )
        finally:
            fstab.close()

    @method(in_signature="s", out_signature="ia{ss}aa{ss}")
    def get_partitions(self, device):
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
        args = ["zfs", "get", "-H", field]
        if device:
            args.append(device)
        ret, out, err = invoke(args, return_out_err=True, log=False)
        return [line.split("\t") for line in out.split("\n")[:-1]]

    @method(in_signature="sss", out_signature="i")
    def zfs_set(self, device, field, value):
        return invoke(["zfs", "set", ("%s=%s" % (field, value)), device])

    @method(in_signature="is", out_signature="")
    def zfs_mount(self, jid, device):
        cmd = ["zfs", "mount", device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="is", out_signature="")
    def zfs_unmount(self, jid, device):
        cmd = ["zfs", "unmount", device]
        if jid != -1:
            self.job_add_command(jid, cmd)
        else:
            invoke(cmd)

    @method(in_signature="s", out_signature="i")
    def zfs_destroy(self, device):
        return invoke(["zpool", "destroy", device])

    @method(in_signature="isss", out_signature="")
    def zfs_format(self, jid, devpath, label, mountpoint):
        self.job_add_command(jid, ["zpool", "create", "-m", mountpoint, label, devpath])

    @method(in_signature="iss", out_signature="")
    def zfs_create_volume(self, jid, pool, volume):
        self.job_add_command(jid, ["zfs", "create", "%s/%s" % (pool, volume)])

    @method(in_signature="ss", out_signature="i")
    def zfs_destroy_volume(self, pool, volume):
        return invoke(["zfs", "destroy", "%s/%s" % (pool, volume)])

    @method(in_signature="iss", out_signature="")
    def zfs_create_snapshot(self, jid, orig, snapshot):
        self.job_add_command(jid, ["zfs", "snapshot", "%s@%s" % (orig, snapshot)])
        self.job_add_command(jid, ["zfs", "clone",
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

    @method(in_signature="iss", out_signature="")
    def zfs_expand(self, jid, name, device):
        self.job_add_command(jid, ["zpool", "online", "-e", name, device])
