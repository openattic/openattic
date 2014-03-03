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

from django.db import models

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes.models import InvalidVolumeType, StorageObject, VolumePool, FileSystemVolume, CapabilitiesAwareManager

from zfs import filesystems

def size_to_megs(sizestr):
    mult = {"K": 1024**-1, "M": 1, "G": 1024, "T": 1024**2}
    if sizestr[-1] in mult:
        return float(sizestr[:-1]) * mult[sizestr[-1]]
    return float(sizestr[:-1])


class Zpool(VolumePool):
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    @property
    def fs(self):
        return filesystems.Zfs(self, self)

    @property
    def status(self):
        return self.fs.status

    @property
    def usedmegs(self):
        return self.fs.usedmegs

    def get_volume_class(self, type):
        if type not in ("zfs", None):
            raise InvalidVolumeType(type)
        return Zfs

    def is_fs_supported(self, filesystem):
        return filesystem is filesystems.Zfs


class RaidZ(models.Model):
    name        = models.CharField(max_length=150)
    zpool       = models.ForeignKey(Zpool)
    type        = models.CharField(max_length=150)


class Zfs(FileSystemVolume):
    parent      = models.ForeignKey(StorageObject, blank=True, null=True)

    objects     = getHostDependentManagerClass("zpool__host")()
    all_objects = models.Manager()

    def full_clean(self):
        self.filesystem = "zfs"
        if self.zpool_id is None and self.pool is not None:
            self.zpool = self.pool.volumepool
        return FileSystemVolume.full_clean(self)

    def save(self, database_only=False, *args, **kwargs):
        if database_only:
            return FileSystemVolume.save(self, *args, **kwargs)
        install = (self.id is None)
        if self.zpool_id is None and self.pool is not None:
            self.zpool = self.pool.volumepool
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            if self.name == "":
                self.fs.format()
            else:
                self.fs.create_subvolume(self.name)

    def delete(self):
        FileSystemVolume.delete(self)
        if self.name == "":
            self.fs.destroy()
        else:
            self.fs.destroy_subvolume(self.name)

    @property
    def fs(self):
        if self.parent is not None:
            return filesystems.Zfs(self, self.parent.volumepool)
        return filesystems.Zfs(self, self.storageobj.volumepool)

    @property
    def status(self):
        if self.parent is not None:
            return self.parent.volumepool.volumepool.status
        return self.storageobj.volumepool.volumepool.status

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
    def host(self):
        if self.parent is not None:
            return self.parent.volumepool.volumepool.host
        return self.storageobj.volumepool.volumepool.host

    @property
    def fullname(self):
        if self.parent is not None:
            parentname = self.parent.filesystemvolume.volume.fullname
        else:
            parentname = self.storageobj.name
        return "%s/%s" % (parentname, self.storageobj.name)

    def __unicode__(self):
        return self.fullname
