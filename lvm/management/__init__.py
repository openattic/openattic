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

try:
    import readline
except ImportError:
    pass

from os.path import exists

from django.contrib.auth.models import User
from django.db.models import signals

from systemd import dbus_to_python, get_dbus_object

import lvm.models
import sysutils.models
from ifconfig.models  import Host
from lvm              import blockdevices
from lvm.models       import VolumeGroup, LogicalVolume

def create_vgs(**kwargs):
    lvm = get_dbus_object("/lvm")

    vgs = dbus_to_python(lvm.vgs())
    lvs = dbus_to_python(lvm.lvs())
    mounts = blockdevices.get_mounts()

    for vgname in vgs:
        try:
            vg = VolumeGroup.objects.get(name=vgname)
        except VolumeGroup.DoesNotExist:
            print "Adding Volume Group", vgname
            vg = VolumeGroup(host=Host.objects.get_current(), name=vgname)
            vg.save()
        else:
            print "Volume Group", vgname, "already exists in the database"
            if vg.host != Host.objects.get_current():
                vg.host = Host.objects.get_current()
                vg.save()

    if User.objects.count() == 0:
        print "Can't add LVs, no users have been configured yet"
        return

    try:
        admin = User.objects.get(username="openattic", is_superuser=True)
    except User.DoesNotExist:
        admin = User.objects.filter( is_superuser=True )[0]

    for lvname in lvs:
        vg = VolumeGroup.objects.get(name=lvs[lvname]["LVM2_VG_NAME"])
        try:
            lv = LogicalVolume.objects.get(vg=vg, name=lvname)
        except LogicalVolume.DoesNotExist:
            if "sys" in lvs[lvname]["LVM2_LV_TAGS"].split(','):
                print "Logical Volume %s is tagged as @sys, ignored." % lvname
                continue

            lv = LogicalVolume(name=lvname, megs=float(lvs[lvname]["LVM2_LV_SIZE"]), vg=vg, owner=admin, uuid=lvs[lvname]["LVM2_LV_UUID"])
            print lv.name, lv.megs, lv.vg.name, lv.owner.username
            lv.save(database_only=True)

        else:
            print "Logical Volume", lvname, "already exists in the database"
            if not lv.uuid:
                lv.uuid = lvs[lvname]["LVM2_LV_UUID"]
                lv.save()


sysutils.models.post_install.connect(create_vgs, sender=sysutils.models)
