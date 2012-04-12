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

import dbus

try:
    import readline
except ImportError:
    pass

from django.contrib.auth.models import User
from django.db.models import signals
from django.conf      import settings

from systemd.helpers import dbus_to_python

import lvm.models
from lvm.models       import VolumeGroup, LogicalVolume
from lvm.filesystems  import get_by_name as get_fs_by_name

def create_vgs(app, created_models, verbosity, **kwargs):
    try:
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
    except dbus.exceptions.DBusException:
        # apparently systemd is not yet running. oaconfig install will run syncdb a second time, warn and ignore.
        print "WARNING: Could not connect to systemd, skipping initialization of the LVM module."
        return

    vgs = dbus_to_python(lvm.vgs())
    lvs = dbus_to_python(lvm.lvs())
    mounts = VolumeGroup.get_mounts()
    zfs = dbus_to_python(lvm.zfs_getspace(""))

    for vgname in vgs:
        try:
            vg = VolumeGroup.objects.get(name=vgname)
        except VolumeGroup.DoesNotExist:
            print "Adding Volume Group", vgname
            vg = VolumeGroup(name=vgname)
            vg.save()
        else:
            print "Volume Group", vgname, "already exists in the database"

    if User.objects.count() == 0:
        print "Can't add LVs, no users have been configured yet"
        return

    currowner = None
    for lvname in lvs:
        vg = VolumeGroup.objects.get(name=lvs[lvname]["LVM2_VG_NAME"])
        try:
            lv = LogicalVolume.objects.get(vg=vg, name=lvname)
        except LogicalVolume.DoesNotExist:
            if "sys" in lvs[lvname]["LVM2_LV_TAGS"].split(','):
                continue

            if kwargs.get('interactive', True):
                if currowner:
                    ownername = raw_input( "Who is the owner of Logical Volume %s? [%s] " % (lvname, currowner.username) )
                else:
                    ownername = raw_input( "Who is the owner of Logical Volume %s? " % lvname )

                if not currowner or ( ownername and ownername != currowner.username ):
                    currowner = User.objects.get(username=ownername)

                lv = LogicalVolume(name=lvname, megs=float(lvs[lvname]["LVM2_LV_SIZE"]), vg=vg, owner=currowner)

                for mnt in mounts:
                    if mnt[0] in ( "/dev/%s/%s" % ( vg.name, lvname ), "/dev/mapper/%s-%s" % ( vg.name, lvname ) ):
                        try:
                            get_fs_by_name( mnt[2] )
                        except AttributeError:
                            pass
                        else:
                            lv.filesystem = mnt[2]

                for zfsvol in zfs:
                    if lvname == zfsvol[0]:
                        lv.filesystem = "zfs"

                print lv.name, lv.megs, lv.vg.name, lv.owner.username, lv.filesystem
                lv.save(database_only=True)

            else:
                print "Can't add Logical Volume", lvname, "in non-interactive mode"
        else:
            print "Logical Volume", lvname, "already exists in the database"


signals.post_syncdb.connect(create_vgs, sender=lvm.models)
