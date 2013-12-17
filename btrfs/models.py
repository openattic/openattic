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

from btrfs import filesystems


class Btrfs(VolumePool):
    name        = models.CharField(max_length=150)
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        install = (self.id is None)
        VolumePool.save(self, *args, **kwargs)
        if install:
            self.fs.format()

    @property
    def fullname(self):
        return self.name

    @property
    def fs(self):
        return filesystems.Btrfs(self)

    @property
    def type(self):
        return "Btrfs"

    @property
    def status(self):
        return "online"

    @property
    def megs(self):
        return self.fs.stat["size"]

    @property
    def usedmegs(self):
        return self.fs.stat["used"]

    def get_volume_class(self, type):
        if type not in ("btrfs", None):
            raise InvalidVolumeType(type)
        return BtrfsSubvolume

    def is_fs_supported(self, filesystem):
        return filesystem is filesystems.Btrfs


class BtrfsSubvolume(FileSystemVolume):
    name        = models.CharField(max_length=150)
    btrfs       = models.ForeignKey(Btrfs)
    parent      = models.ForeignKey('self', blank=True, null=True)
    filesystem  = "btrfs"

    objects     = getHostDependentManagerClass("btrfs__host")()
    all_objects = models.Manager()

    def full_clean(self):
        if self.btrfs_id is None and self.pool is not None:
            self.btrfs = self.pool.volumepool
        return FileSystemVolume.full_clean(self)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if self.btrfs_id is None and self.pool is not None:
            self.btrfs = self.pool.volumepool
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            self.fs.create_subvolume(self.path)

    def delete(self):
        self.fs.delete_subvolume(self.path)
        FileSystemVolume.delete(self)

    @property
    def fs(self):
        return filesystems.Btrfs(self)

    @property
    def status(self):
        return self.btrfs.status

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
        return self.btrfs.megs

    @property
    def host(self):
        return self.btrfs.host

    @property
    def fullname(self):
        if self.parent is not None:
            parentname = self.parent.fullname
        else:
            parentname = self.btrfs.name
        return "%s/%s" % (parentname, self.name)

    def __unicode__(self):
        return self.fullname
