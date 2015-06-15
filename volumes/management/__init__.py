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
import pyudev
import sysutils.models

from ifconfig.models import Host
from volumes.models import StorageObject, DiskDevice, GenericDisk
from systemd.helpers import get_dbus_object

def update_disks(**kwargs):
    ctx = pyudev.Context()

    for dev in ctx.list_devices():
        if dev.subsystem != "block":
            continue
        if "MAJOR" not in dev or int(dev["MAJOR"].strip("\0")) != 8:
            continue

        if "MINOR" not in dev or int(dev["MINOR"].strip("\0")) % 16 != 0:
            continue

        if "ID_TYPE" not in dev or dev["ID_TYPE"].strip("\0") != "disk":
            continue

        if "ID_VENDOR" in dev and dev["ID_VENDOR"].strip("\0") in ("LSI", "IBM", "AMI"):
            # skip disks created by LSI hardware raid adapters or AMI IPMI (SuperMicro)
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

                drpm = int(get_dbus_object("/volumes").get_rotational_rate(dev.device_node))

            megs = int(get_dbus_object("/volumes").get_disk_size(dev.device_node))

            with StorageObject(name=dev.get("ID_MODEL", "unknown disk"), megs=megs) as so:
                diskdev = DiskDevice(storageobj=so, host=Host.objects.get_current(), serial=serial,
                                    model=dev.get("ID_MODEL", "unknown"), type=dtype, rpm=drpm)
                diskdev.save()

        try:
            diskdev.genericdisk
        except GenericDisk.DoesNotExist:
            gd = GenericDisk(storageobj=diskdev.storageobj, disk_device=diskdev)
            gd.save()

sysutils.models.post_install.connect(update_disks, sender=sysutils.models)
