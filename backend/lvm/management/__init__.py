# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

try:
    import readline
except ImportError:
    pass

from os.path import exists

from django.contrib.auth.models import User
from django.db.models import signals
from django.core.cache import get_cache

from systemd import dbus_to_python, get_dbus_object

import lvm.models
import sysutils.models
from ifconfig.models  import Host
from lvm              import blockdevices
from lvm.models       import VolumeGroup, LogicalVolume
from volumes.models   import StorageObject

def create_vgs(**kwargs):
    get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])
    lvm = get_dbus_object("/lvm")

    vgs = dbus_to_python(lvm.vgs())
    lvs = dbus_to_python(lvm.lvs())

    for vgname in vgs:
        try:
            vg = VolumeGroup.objects.get(storageobj__name=vgname)
        except VolumeGroup.DoesNotExist:
            print "Adding Volume Group", vgname
            so = StorageObject(name=vgname, megs=float(vgs[vgname]["LVM2_VG_SIZE"]), is_origin=True)
            so.save()
            vg = VolumeGroup(host=Host.objects.get_current(), storageobj=so)
            vg.save()
        else:
            print "Volume Group", vgname, "already exists in the database"
            vg.host = Host.objects.get_current()
            so = vg.storageobj
            so.megs = float(vgs[vgname]["LVM2_VG_SIZE"])
            so.save()

    if User.objects.count() == 0:
        print "Can't add LVs, no users have been configured yet"
        return

    try:
        admin = User.objects.get(username="openattic", is_superuser=True)
    except User.DoesNotExist:
        admin = User.objects.filter( is_superuser=True )[0]

    for lvname in lvs:
        vg = VolumeGroup.objects.get(storageobj__name=lvs[lvname]["LVM2_VG_NAME"])
        try:
            lv = LogicalVolume.objects.get(vg=vg, storageobj__name=lvname)
        except LogicalVolume.DoesNotExist:
            if "sys" in lvs[lvname]["LVM2_LV_TAGS"].split(','):
                print "Logical Volume %s is tagged as @sys, ignored." % lvname
                continue

            so = StorageObject(name=lvname, megs=float(lvs[lvname]["LVM2_LV_SIZE"]), uuid=lvs[lvname]["LVM2_LV_UUID"], source_pool=vg)
            so.save()
            lv = LogicalVolume(storageobj=so, vg=vg)
            print lv.storageobj.name, lv.storageobj.megs, lv.vg.storageobj.name
            lv.save(database_only=True)
            lv.detect_fs()

        else:
            print "Logical Volume", lvname, "already exists in the database"
            so = lv.storageobj
            so.megs = float(lvs[lvname]["LVM2_LV_SIZE"])
            so.save()


sysutils.models.post_install.connect(create_vgs, sender=sysutils.models)
