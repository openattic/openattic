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

from django.db import models

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes.models import InvalidVolumeType, VolumePool, FileSystemVolume, CapabilitiesAwareManager

from zfs import filesystems

class Zpool(VolumePool):
    name        = models.CharField(max_length=150)
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    @property
    def type(self):
        return "Zpool"

    @property
    def fs(self):
        return filesystems.Zfs(self, self)

    @property
    def status(self):
        return self.fs.status

    @property
    def megs(self):
        return self.fs.megs

    @property
    def usedmegs(self):
        return self.fs.usedmegs

    def get_volume_class(self, type):
        if type not in ("zfs", None):
            raise InvalidVolumeType(type)
        return Zfs


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

    def full_clean(self):
        if self.zpool_id is None and self.pool is not None:
            self.zpool = self.pool.volumepool
        return FileSystemVolume.full_clean(self)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if self.zpool_id is None and self.pool is not None:
            self.zpool = self.pool.volumepool
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            self.fs.create_subvolume(self.name)

    def delete(self):
        FileSystemVolume.delete(self)
        self.fs.destroy_subvolume(self.name)

    @property
    def fs(self):
        return filesystems.Zfs(self, self.zpool)

    @property
    def status(self):
        return self.zpool.status

    @property
    def path(self):
        return self.fs.path

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat

    @property
    def megs(self):
        return self.fs.stat["size"] or self.zpool.megs

    @property
    def host(self):
        return self.zpool.host

    @property
    def fullname(self):
        if self.parent_zfs is not None:
            parentname = self.parent_zfs.fullname
        else:
            parentname = self.zpool.name
        if not self.name:
            return parentname
        return "%s/%s" % (parentname, self.name)

    def __unicode__(self):
        return self.fullname
