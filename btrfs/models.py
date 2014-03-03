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

from btrfs import filesystems


class Btrfs(VolumePool):
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    @property
    def fullname(self):
        return self.name

    @property
    def fs(self):
        return filesystems.Btrfs(self)

    @property
    def status(self):
        return "online"

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
    parent      = models.ForeignKey(StorageObject, blank=True, null=True)

    objects     = getHostDependentManagerClass("btrfs__host")()
    all_objects = models.Manager()

    def full_clean(self):
        self.filesystem = "btrfs"
        if self.btrfs_id is None and self.pool is not None:
            self.btrfs = self.pool.volumepool
        return FileSystemVolume.full_clean(self)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if self.btrfs_id is None and self.pool is not None:
            self.btrfs = self.pool.volumepool
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            if self.name == "":
                self.fs.format()
            else:
                self.fs.create_subvolume(self.path)

    def delete(self):
        if self.name != "":
            self.fs.delete_subvolume(self.path)
        FileSystemVolume.delete(self)

    @property
    def base(self):
        return self.storageobj.volumepool.volumepool.member_set.all()[0]

    @property
    def fs(self):
        return filesystems.Btrfs(self)

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
