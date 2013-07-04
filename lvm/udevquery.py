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
    data = dict(device.items())
    data["Size"] = str(int(device.attributes["size"]) * 512)
    data["__partitions__"] = []

    if "ID_PART_TABLE_TYPE" in device:
        partitions = device.children
    else:
        partitions = [device]

    for device in partitions:
        if "ID_FS_TYPE" not in device or device["ID_FS_TYPE"] == "linux_raid_member":
            continue

        partinfo = {
            "Name":       device["DEVNAME"],
            "FileSystem": device["ID_FS_TYPE"]
            }

        partinfo.update(device)

        if device["ID_FS_TYPE"] == "LVM2_member":
            partinfo["FreeSpace"] = device["UDISKS_LVM2_PV_VG_FREE_SIZE"]
        elif device["ID_FS_USAGE"] == "filesystem":
            for mntdev, mntpoint, mnttype, _, _, _ in get_mounts():
                if os.path.realpath(mntdev) == device.device_node and mnttype == device["ID_FS_TYPE"]:
                    s = os.statvfs(mntpoint)
                    partinfo["FreeSpace"] = str(s.f_bfree * s.f_frsize)

        data["__partitions__"].append(partinfo)

    return data

