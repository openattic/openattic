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
from zfs.models import Zpool, Zfs, size_to_megs

def update_disksize(**kwargs):
    admin = User.objects.filter( is_superuser=True )[0]
    zfs_space = dbus_to_python(get_dbus_object("/zfs").zfs_getspace(""))
    for name, avail, used, usedsnap, usedds, usedrefreserv, usedchild in zfs_space:
        if "/" in name:
            zpool_name, zvol_name = name.split("/", 1)
        else:
            zpool_name = name
            zvol_name  = None

        try:
            zpool = Zpool.objects.get(name=zpool_name)
            print "Found existing ZPool", zpool_name
        except Zpool.DoesNotExist:
            print "Found new ZPool", zpool_name
            zpool = Zpool(name=zpool_name, is_origin=True, megs=size_to_megs(avail), host=Host.objects.get_current())
            zpool.full_clean()
            zpool.save()

        if zvol_name is None:
            zpool.megs = size_to_megs(avail)
            zpool.full_clean()
            zpool.save()
            try:
                rootvol = zpool.zfs_set.get(name="")
            except Zfs.DoesNotExist:
                print "Root volume for zpool %s is missing, creating it" % zpool_name
                rootvol = Zfs(name="", pool=zpool, host=Host.objects.get_current(), owner=admin)
            rootvol.megs = zpool.megs
            rootvol.full_clean()
            rootvol.save(database_only=True)
        else:
            try:
                zfs = Zfs.objects.get(name=zvol_name, pool=zpool)
                print "Found existing ZFS Volume", zvol_name
            except Zfs.DoesNotExist:
                print "Found new ZFS Volume", zvol_name
                zfs = Zfs(name=zvol_name, pool=zpool, host=Host.objects.get_current(), owner=admin)

            zfs.megs = size_to_megs(avail)
            zfs.full_clean()
            zfs.save(database_only=True)


sysutils.models.post_install.connect(update_disksize, sender=sysutils.models)
