# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import re
import dbus

from django.conf import settings

from systemd.helpers import dbus_to_python

class UnsupportedRAID(Exception):
    pass

class UnsupportedRAIDVendor(UnsupportedRAID):
    pass

class UnsupportedRAIDLevel(UnsupportedRAID):
    pass

def get_raid_params(pvpath):
    if not pvpath.startswith("/dev/md"):
        raise UnsupportedRAIDVendor()
    mddev = pvpath[5:]
    chunksize = int(open("/sys/class/block/%s/md/chunk_size" % mddev, "r").read().strip())
    raiddisks = int(open("/sys/class/block/%s/md/raid_disks" % mddev, "r").read().strip())
    raidlevel = int(open("/sys/class/block/%s/md/level" % mddev, "r").read().strip()[4:])
    if raidlevel == 0:
        datadisks = raiddisks
    elif raidlevel == 1:
        datadisks = 1
    elif raidlevel == 5:
        datadisks = raiddisks - 1
    elif raidlevel == 6:
        datadisks = raiddisks - 2
    elif raidlevel == 10:
        datadisks = raiddisks / 2
    else:
        raise UnsupportedRAIDLevel(raidlevel)
    stripewidth = chunksize * datadisks
    return {
        "chunksize": chunksize,
        "raiddisks": raiddisks,
        "raidlevel": raidlevel,
        "datadisks": datadisks,
        "stripewidth": stripewidth,
        }

def get_mounts():
    """ Get currently mounted devices. """
    fd = open("/proc/mounts", "rb")
    try:
        mounts = fd.read()
    finally:
        fd.close()
    return [ line.split(" ") for line in mounts.split("\n") if line ]

def get_devices():
    """ Get existing block devices. """
    devinfo = []

    def getfile(basedir, fname):
        fd = open( os.path.join( basedir, fname ), "rb")
        try:
            return fd.read().strip()
        finally:
            fd.close()

    for dirname in os.listdir("/sys/bus/scsi/devices"):
        if re.match( "^\d+:\d+:\d+:\d+$", dirname ):
            basedir = os.path.join( "/sys/bus/scsi/devices", dirname )
            if not os.path.exists(os.path.join( basedir, "block" )):
                continue
            devinfo.append({
                "type":   getfile(basedir, "type"),
                "vendor": getfile(basedir, "vendor"),
                "model":  getfile(basedir, "model"),
                "rev":    getfile(basedir, "rev"),
                "block":  os.listdir( os.path.join( basedir, "block" ) )[0]
                })

    return devinfo

def is_device_in_use(device):
    """ Check if this device is mounted somewhere or used as a physical volume. """
    lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
    pvs = lvm.pvs()
    for pvdev in pvs:
        if device in pvdev:
            return True, "pv", unicode(pvs[pvdev]["LVM2_VG_NAME"])
    for mount in get_mounts():
        if device in os.path.realpath(mount[0]):
            return True, "mount", mount[1]
    return False

def get_partitions(device):
    """ Get partitions from the given device. """
    lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
    ret, disk, part = lvm.get_partitions(device)
    if ret:
        raise SystemError("parted failed, check the log")
    return dbus_to_python(disk), dbus_to_python(part)

def get_disk_stats(device):
    """ Get disk stats from `/sys/block/X/stat'. """
    if not os.path.exists( "/sys/block/%s/stat" % device ):
        raise SystemError( "No such device: '%s'" % device )

    fd = open("/sys/block/%s/stat" % device, "rb")
    try:
        stats = fd.read().split()
    finally:
        fd.close()

    return dict( zip( [
        "reads_completed",  "reads_merged",  "sectors_read",    "millisecs_reading",
        "writes_completed", "writes_merged", "sectors_written", "millisecs_writing",
        "ios_in_progress",  "millisecs_in_io", "weighted_millisecs_in_io"
        ], [ int(num) for num in stats ] ) )

def get_lvm_capabilities():
    lvm  = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
    return dbus_to_python(lvm.get_lvm_capabilities())
