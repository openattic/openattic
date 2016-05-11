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

import os
import os.path
import dbus
import pyudev
import sysutils.models

from ifconfig.models import Host
from volumes.models import StorageObject, DiskDevice, GenericDisk
from systemd.helpers import get_dbus_object

def update_disks(**kwargs):

    # According to the Linux kernel documentation, the following block major
    # numbers are reserved for SCSI disk devices and should be scanned:
    #   8 (SCSI disk devices 0-15)
    #  65 (SCSI disk devices 16-31) - 71 (SCSI disk devices 112-127)
    # 128 (SCSI disk devices 128-143) - 135 (SCSI disk devices 240-255)

    SCSIMAJORS = ["8", "65", "66", "67", "68", "69", "70", "71"]
    SCSIMAJORS += ["128", "129", "130", "131", "132", "133", "134", "134"]

    ctx = pyudev.Context()

    for dev in ctx.list_devices(subsystem='block', DEVTYPE='disk'):

        if (("MAJOR" not in dev or dev["MAJOR"] not in SCSIMAJORS)
                and "virtio" not in dev.device_path):
                continue

        if "ID_VENDOR" in dev and dev["ID_VENDOR"].strip("\0") in ("LSI", "IBM", "AMI"):
            # skip disks created by LSI hardware raid adapters or AMI IPMI (SuperMicro)
            continue

        if int(dev.attributes["size"].strip("\0")) == 0:
            continue

        print "checking disk", dev.device_node

        # See if we have a serial
        for attr in ("ID_SCSI_SERIAL", "ID_SERIAL_SHORT", "ID_SERIAL"):
            if attr in dev:
                serial = dev[attr].strip("\0")
                break
        else:
            print "serial not found"
            continue

        try:
            diskdev = DiskDevice.objects.get(serial=serial)
        except DiskDevice.DoesNotExist:
            rotational_path = os.path.join(dev.sys_path, "queue", "rotational")

            with open(rotational_path, "rb") as fd:
                rotational = fd.read().strip() == "1"

            if not rotational:
                dtype = "SSD"
                drpm = 0
            else:
                if "/end_device-" in dev.sys_path:
                    # see http://unix.stackexchange.com/questions/96041/can-you-identify-transport-via-sysfs
                    dtype = "SAS"
                else:
                    dtype = "SATA"

                try:
                    drpm = int(get_dbus_object("/volumes").get_rotational_rate(dev.device_node))
                except dbus.DBusException:
                    drpm = 0

            megs = int(get_dbus_object("/volumes").get_disk_size(dev.device_node))

            if "ID_MODEL" in dev:
                so_name = "%s %s" % (dev["ID_MODEL"], serial)
            else:
                so_name = dev.device_node

            with StorageObject(name=so_name, megs=megs) as so:
                diskdev = DiskDevice(storageobj=so, host=Host.objects.get_current(), serial=serial,
                                    model=dev.get("ID_MODEL", "unknown"), type=dtype, rpm=drpm)
                diskdev.save()

        try:
            diskdev.genericdisk
        except GenericDisk.DoesNotExist:
            gd = GenericDisk(storageobj=diskdev.storageobj, disk_device=diskdev)
            gd.save()

sysutils.models.post_install.connect(update_disks, sender=sysutils.models)
