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

from systemd import get_dbus_object, dbus_to_python
from ifconfig.models import Host
from volumes.models import StorageObject, FileSystemVolume
from zfs.models import Zpool, Zfs, size_to_megs

def update_disksize(**kwargs):
    admin = User.objects.filter( is_superuser=True )[0]
    zfs_space = dbus_to_python(get_dbus_object("/zfs").zfs_getspace(""))
    for name, avail, used, usedsnap, usedds, usedrefreserv, usedchild in zfs_space:
        megs = size_to_megs(avail) + size_to_megs(used)
        if "/" in name:
            zpool_name, zvol_name = name.split("/", 1)
        else:
            zpool_name = name
            zvol_name  = None

        try:
            print "Found existing ZPool", zpool_name
            zpool = Zpool.objects.get(storageobj__name=zpool_name)
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
        else:
            try:
                print "Found existing ZFS Volume", zvol_name
                zfs = Zfs.objects.get(storageobj__name=zvol_name, zpool=zpool)
                zfs_so = zfs.storageobj
                zfs_so.megs = megs
                zfs_so.full_clean()
                zfs_so.save()
            except Zfs.DoesNotExist:
                print "Found new ZFS Volume", zvol_name
                zfs_so = StorageObject(name=zvol_name, megs=megs)
                zfs_so.full_clean()
                zfs_so.save()
                zfs = Zfs(storageobj=zfs_so, zpool=zpool, host=Host.objects.get_current(), owner=admin)
                zfs.full_clean()
                zfs.save(database_only=True)


sysutils.models.post_install.connect(update_disksize, sender=sysutils.models)
