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

from __future__ import division

import os

from pyudev import Context, Device

from lvm.blockdevices import get_mounts


def get_blockdevices(uuid=None):
    ctx = Context()
    data = []
    for dev in ctx.list_devices():
        if dev["SUBSYSTEM"] != "block" or dev["DEVTYPE"] != "disk":
            continue
        if uuid is not None and ("ID_SCSI_SERIAL" not in dev or not uuid.startswith(dev["ID_SCSI_SERIAL"])):
            continue
        data.append(get_device_info(dev))
    return data


def get_device_info(device):
    data = {
        "device":     device.device_node,
        "megs":       int(device.attributes["size"]) * 512 / 1024**2,
        "fs_type":    "unknown",
        "raw": {
            "params": dict(device.items()),
            "attrs":  dict(device.attributes),
        }
    }

    if "ID_PART_TABLE_TYPE" in device and device["DEVTYPE"] != "partition":
        data["fs_type"] = "partition_table"
        data["partitions"] = []
        for partdev in device.children:
            data["partitions"].append(get_device_info(partdev))

    elif "ID_FS_TYPE" in device:
        data["fs_type"] = device["ID_FS_TYPE"]
        if device["ID_FS_TYPE"] == "LVM2_member":
            data["mountpoint"] = device["UDISKS_LVM2_PV_VG_NAME"]
            data["megs_free"]  = int(device["UDISKS_LVM2_PV_VG_FREE_SIZE"]) / 1024**2
        elif device["ID_FS_TYPE"] != "linux_raid_member" and device["ID_FS_USAGE"] == "filesystem":
            for mntdev, mntpoint, mnttype, _, _, _ in get_mounts():
                if os.path.realpath(mntdev) == device.device_node and mnttype == device["ID_FS_TYPE"]:
                    s = os.statvfs(mntpoint)
                    data["mountpoint"] = mntpoint
                    data["megs_free"]  = s.f_bfree * s.f_frsize / 1024**2

    return data

