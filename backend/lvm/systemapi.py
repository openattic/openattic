# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import logging

from time import time

from django.core.cache import get_cache

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method, deferredmethod

from lvm.conf   import settings as lvm_settings
from lvm.models import LogicalVolume

def lvm_command(cmd):
    cache = get_cache("systemd")

    cachedval = cache.get(cmd[0])
    if cachedval is not None:
        return cachedval

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

    cache.set(cmd[0], result, 15)

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
    info = dict( [ (lv["LVM2_LV_NAME"], lv) for lv in lvm_command(["/sbin/lvs", '-o', '+lv_kernel_minor,lv_minor,uuid,lv_tags']) ] )
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

    @deferredmethod(in_signature="s")
    def pvcreate(self, device, sender):
        invoke(["/sbin/pvcreate", device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    @deferredmethod(in_signature="sas")
    def vgcreate(self, vgname, devices, sender):
        cmd = ["/sbin/vgcreate", vgname]
        cmd.extend(devices)
        invoke(cmd)
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    @deferredmethod(in_signature="ssis")
    def lvcreate(self, vgname, lvname, megs, snapshot, sender):
        cmd = ["/sbin/lvcreate"]
        if lvm_settings.HAVE_YES_OPTION:
            cmd.append("--yes")
        if snapshot:
            cmd.extend(["-s", snapshot])
        cmd.extend(["-L", ("%dM" % megs),
            '-n', lvname,
            ])
        if not snapshot:
            cmd.append(vgname)
        self.lvs_time = 0
        invoke(cmd)
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs"])
        if not snapshot:
            invoke(["blkdevzero", "/dev/%s/%s" % (vgname, lvname)])
        # Update UUID
        self.lvs_time = time()
        self.lvs_cache = lvm_lvs()
        try:
            lv_mdl = LogicalVolume.objects.get(storageobj__name=lvname)
        except LogicalVolume.DoesNotExist:
            # Apparently, someone decided to delete the model before we even
            # got here, so no need to try updating the UUID.
            pass
        else:
            lv_mdl.uuid = self.lvs_cache[lvname]["LVM2_LV_UUID"]
            lv_mdl.save(database_only=True)

    @deferredmethod(in_signature="sb")
    def lvchange(self, device, active, sender):
        self.lvs_time = 0
        invoke(["/sbin/lvchange", ('-a' + {False: 'n', True: 'y'}[active]), device])

    @deferredmethod(in_signature="sib")
    def lvresize(self, device, megs, grow, sender):
        if not grow:
            invoke(["/sbin/lvchange", '-an', device])

        invoke(["/sbin/lvresize", '-L', ("%dM" % megs), device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs"])

        if not grow:
            invoke(["/sbin/lvchange", '-ay', device])

    @deferredmethod(in_signature="s")
    def lvmerge(self, device, sender):
        self.lvs_time = 0
        invoke(["/sbin/lvconvert", "--merge", device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs"])

    @deferredmethod(in_signature="s")
    def lvremove(self, device, sender):
        self.lvs_time = 0
        invoke(["/sbin/lvremove", '-f', device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs"])

    @deferredmethod(in_signature="s")
    def vgremove(self, device, sender):
        self.vgs_time = 0
        invoke(["/sbin/vgremove", '-f', device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    @deferredmethod(in_signature="s")
    def pvremove(self, device, sender):
        self.pvs_time = 0
        invoke(["/sbin/pvremove", '-f', device])
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    @method(in_signature="s", out_signature="s")
    def get_type(self, device):
        ret, out, err = invoke(["file", "-sL", device], return_out_err=True)
        dev, info = out.split(":", 1)
        return info.strip()

    @method(in_signature="", out_signature="a{ss}")
    def get_lvm_capabilities(self):
        invoke(["/sbin/modprobe", "dm-snapshot"])
        ret, out, err = invoke(["/sbin/dmsetup", "targets"], return_out_err=True)
        if ret != 0:
            raise SystemError("dmsetup targets failed: " + err)
        return dict([ line.split() for line in out.split("\n") if line.strip()])

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


