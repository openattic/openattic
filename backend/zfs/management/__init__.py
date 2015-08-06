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

import sysutils.models

from django.contrib.auth.models import User
from dbus import DBusException

from systemd import get_dbus_object, dbus_to_python
from ifconfig.models import Host
from volumes.models import StorageObject, FileSystemVolume
from zfs.models import Zpool, Zfs, ZVol
from zfs.filesystems import scale_to_megs

def update_disksize(**kwargs):
    admin = User.objects.filter( is_superuser=True )[0]
    try:
        zfs_space = dbus_to_python(get_dbus_object("/zfs").zfs_getspace(""))
    except DBusException:
        # ZFS not installed
        return
    for record in zfs_space:
        name  = record["name"]
        avail = scale_to_megs(record["avail"])
        used  = scale_to_megs(record["used"])
        megs  = avail + used
        if "/" in name:
            zpool_name, zvol_name = name.split("/", 1)
        else:
            zpool_name = name
            zvol_name  = None

        try:
            zpool = Zpool.objects.get(storageobj__name=zpool_name)
            print "Found existing ZPool", zpool_name
            zp_so = zpool.storageobj
        except Zpool.DoesNotExist:
            print "Found new ZPool", zpool_name
            zp_so = StorageObject(name=zpool_name, is_origin=True, megs=megs)
            zp_so.full_clean()
            zp_so.save()
            zpool = Zpool(storageobj=zp_so, host=Host.objects.get_current())
            zpool.full_clean()
            zpool.save()

        if zvol_name is None:
            zp_so.megs = megs
            zp_so.full_clean()
            zp_so.save()
            try:
                rootvol = zp_so.filesystemvolume.volume
            except FileSystemVolume.DoesNotExist:
                print "Root volume for zpool %s is missing, creating it" % zpool_name
                rootvol = Zfs(storageobj=zp_so, zpool=zpool, host=Host.objects.get_current(), owner=admin)
                rootvol.full_clean()
                rootvol.save(database_only=True)

        elif record["type"] == "volume":
            megs = scale_to_megs(record["volsize"])
            try:
                zfs = ZVol.objects.get(storageobj__name=zvol_name, zpool=zpool)
                print "Found existing ZVol", zvol_name
                zfs_so = zfs.storageobj
                zfs_so.megs = megs
                zfs_so.full_clean()
                zfs_so.save()
            except ZVol.DoesNotExist:
                print "Found new ZVol", zvol_name
                zfs_so = StorageObject(name=zvol_name, megs=megs, source_pool=zpool)
                zfs_so.full_clean()
                zfs_so.save()
                zfs = ZVol(storageobj=zfs_so, zpool=zpool, host=Host.objects.get_current())
                zfs.full_clean()
                zfs.save(database_only=True)

        else:
            if record["quota"] not in ("none", "-"):
                megs = scale_to_megs(record["quota"])
            else:
                megs = zp_so.megs
            try:
                zfs = Zfs.objects.get(storageobj__name=zvol_name, zpool=zpool)
                print "Found existing ZFS Volume", zvol_name
                zfs_so = zfs.storageobj
                zfs_so.megs = megs
                zfs_so.full_clean()
                zfs_so.save()
            except Zfs.DoesNotExist:
                print "Found new ZFS Volume", zvol_name
                zfs_so = StorageObject(name=zvol_name, megs=megs, source_pool=zpool)
                zfs_so.full_clean()
                zfs_so.save()
                zfs = Zfs(storageobj=zfs_so, zpool=zpool, host=Host.objects.get_current(), owner=admin, parent=zp_so)
                zfs.full_clean()
                zfs.save(database_only=True)

    # make sure the zpools we now know all have a .snapshots subvolume.
    for storageobj in StorageObject.objects.filter(volumepool__zpool__isnull=False):
        vp = storageobj.volumepool.volumepool
        try:
            snapshots = vp.volume_set.get(name=".snapshots")
        except StorageObject.DoesNotExist:
            dso = StorageObject(name=".snapshots", megs=vp.storageobj.megs, source_pool=vp)
            dso.full_clean()
            dso.save()
            dvol = vp._create_volume_for_storageobject(dso, {
                "filesystem": "zfs", "fswarning": 99, "fscritical": 99, "owner": admin
                })

sysutils.models.post_install.connect(update_disksize, sender=sysutils.models)
