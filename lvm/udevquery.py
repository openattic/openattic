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

# oh god this sucks so much ass it's unbelievable

import os

from pyudev import Context, Device

from lvm.blockdevices import get_mounts

def get_blockdevices():
    ctx = Context()
    return [ get_device_info(dev) for dev in ctx.list_devices() if dev["SUBSYSTEM"] == "block"]

def find_blockdevice(uuid):
    ctx = Context()
    for dev in ctx.list_devices():
        if dev["SUBSYSTEM"] == "block" and "ID_SCSI_SERIAL" in dev and uuid.startswith(dev["ID_SCSI_SERIAL"]):
            print "found", dev.device_node
            return get_device_info(dev)
    raise SystemError("no such device found")

def get_device_info(device):
    data = dict(device.items())
    btsize, btused = get_device_utilization(device)
    if btsize is not None and btused is not None:
        data["Size"] = str(btsize)
        data["__partitions__"] = [{
            "FreeSpace":  str(btsize - btused),
            "Name":       device["DEVNAME"],
            "FileSystem": device["ID_FS_TYPE"]
            }]
    else:
        raise SystemError("could not get usage info")
    return data

def get_device_utilization(device):
    btsize = None
    btused = None
    if "ID_PART_TABLE_TYPE" in device:
        print "no idea how to correctly handle partitioned disks"
    elif "ID_FS_TYPE" in device:
        if device["ID_FS_TYPE"] == "LVM2_member":
            btsize = int(device["UDISKS_LVM2_PV_VG_EXTENT_COUNT"]) * int(device["UDISKS_LVM2_PV_VG_EXTENT_SIZE"])
            btused = btsize - int(device["UDISKS_LVM2_PV_VG_FREE_SIZE"])
        elif device["ID_FS_TYPE"] == "linux_raid_member":
            print "no idea how to correctly handle raid members"
        elif device["ID_FS_USAGE"] == "filesystem":
            for mntdev, mntpoint, mnttype, _, _, _ in get_mounts():
                if os.path.realpath(mntdev) == device.device_node and mnttype == device["ID_FS_TYPE"]:
                    s = os.statvfs(mntpoint)
                    btsize = s.f_blocks * s.f_frsize
                    btused = (s.f_blocks - s.f_bfree) * s.f_frsize
    return btsize, btused
