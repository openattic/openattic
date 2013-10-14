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

from django.db import models
from django.conf import settings

from systemd.helpers import dbus_to_python
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes.models import VolumePool, FileSystemVolume, CapabilitiesAwareManager

from zfs import filesystems

SIZE_MULTIPLIERS = {
    'T': 1024**2,
    'G': 1024**1,
    'M': 1024**0,
    'K': 1024**-1,
}

def scale_to_megs(size):
    if size[-1] in SIZE_MULTIPLIERS:
        # size is something like "672.42G", scale to MBytes
        return float(size[:-1]) * SIZE_MULTIPLIERS[size[-1]]
    # size seems to be in bytes
    return float(size) * 1024**-2


class Zpool(VolumePool):
    name        = models.CharField(max_length=150)
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    @property
    def dbus_object(self):
        return dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/zfs")

    @property
    def type(self):
        return "Zpool"

    @property
    def status(self):
        return dbus_to_python(self.dbus_object.zpool_get(self.name, "health")[0][2])

    @property
    def megs(self):
        return scale_to_megs(dbus_to_python(self.dbus_object.zpool_get(self.name, "size")[0][2]))

    @property
    def usedmegs(self):
        return scale_to_megs(dbus_to_python(self.dbus_object.zpool_get(self.name, "allocated")[0][2]))

    @property
    def status(self):
        return dbus_to_python(self.dbus_object.zpool_get(self.name, "health")[0][2])


class RaidZ(models.Model):
    name        = models.CharField(max_length=150)
    zpool       = models.ForeignKey(Zpool)
    type        = models.CharField(max_length=150)


class Zfs(FileSystemVolume):
    name        = models.CharField(max_length=150)
    zpool       = models.ForeignKey(Zpool)
    parent_zfs  = models.ForeignKey('self', blank=True, null=True)
    filesystem  = "zfs"

    objects     = getHostDependentManagerClass("zpool__host")()
    all_objects = models.Manager()

    @property
    def fs(self):
        return filesystems.Zfs(self)

    @property
    def fsname(self):
        return "zfs"

    @property
    def mountpoint(self):
        return self.fs.mountpoint

    @property
    def mounthost(self):
        return self.fs.mounthost

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat
