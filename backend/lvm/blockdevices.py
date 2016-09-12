# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import re
import dbus

from systemd import dbus_to_python, get_dbus_object


def get_mounts():
    """ Get currently mounted devices. """
    fd = open("/proc/mounts", "rb")
    try:
        mounts = fd.read()
    finally:
        fd.close()
    return [line.split(" ") for line in mounts.split("\n") if line]


def get_devices():
    """ Get existing block devices. """
    devinfo = []

    def getfile(basedir, fname):
        fd = open(os.path.join(basedir, fname), "rb")
        try:
            return fd.read().strip()
        finally:
            fd.close()

    for dirname in os.listdir("/sys/bus/scsi/devices"):
        if re.match("^\d+:\d+:\d+:\d+$", dirname):
            basedir = os.path.join("/sys/bus/scsi/devices", dirname)
            if not os.path.exists(os.path.join(basedir, "block")):
                continue
            devinfo.append({
                "type":   getfile(basedir, "type"),
                "vendor": getfile(basedir, "vendor"),
                "model":  getfile(basedir, "model"),
                "rev":    getfile(basedir, "rev"),
                "block":  os.listdir(os.path.join(basedir, "block"))[0]
                })

    return devinfo


def is_device_in_use(device):
    """ Check if this device is mounted somewhere or used as a physical volume. """
    lvm = get_dbus_object("/lvm")
    pvs = lvm.pvs()
    for pvdev in pvs:
        if device in pvdev:
            return True, "pv", unicode(pvs[pvdev]["LVM2_VG_NAME"])
    for mount in get_mounts():
        if device in os.path.realpath(mount[0]):
            return True, "mount", mount[1]
    holders = os.listdir('/sys/class/block/%s/holders' % device)
    if holders:
        return True, "mdraid", ','.join(holders)
    # if device is not already a partition or md device, recurse to check partitions
    if re.match("^[a-zA-Z]+$", device):
        try:
            partitions = get_partitions("/dev/" + device)
        except dbus.DBusException, err:
            if err.get_dbus_name() == 'org.freedesktop.DBus.Python.SystemError':
                # no partitions
                pass
            else:
                raise
        else:
            for part in partitions:
                if "number" not in part:
                    # This is the device itself, not one of its partitions
                    continue
                in_use, usetype, info = is_device_in_use(device + part["number"])
                if in_use:
                    return in_use, usetype, info
    return False


def get_partitions(device):
    """ Get partitions from the given device. """
    lvm = get_dbus_object("/lvm")
    ret, disk, part = lvm.get_partitions(device)
    if ret:
        raise SystemError("parted failed, check the log")
    return dbus_to_python(disk), dbus_to_python(part)


def get_lvm_capabilities():
    lvm = get_dbus_object("/lvm")
    return dbus_to_python(lvm.get_lvm_capabilities())


def get_disk_size(device):
    """ Get disk size from `/sys/block/X/size'. """
    if not os.path.exists("/sys/block/%s/size" % device):
        raise SystemError("No such device: '%s'" % device)

    fd = open("/sys/block/%s/size" % device, "rb")
    try:
        return int(fd.read()) * 512 / 1024**2
    finally:
        fd.close()
