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
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.utils.translation    import ugettext_lazy as _
from django.contrib.auth.models  import User

from volumes import capabilities, filesystems

class CapabilitiesAwareManager(models.Manager):
    def filter_by_capability(self, capability):
        return self.extra(where=[self.model._meta.db_table + '.capflags & %s = %s'], params=[capability.flag, capability.flag])


class CapabilitiesAwareModel(models.Model):
    # TODO: This should probably be wrapped in a CapabilitiesField or something
    capflags    = models.BigIntegerField()

    objects     = CapabilitiesAwareManager()

    class Meta:
        abstract = True

    @property
    def capabilities(self):
        return capabilities.from_flags(self.capflags)

    @capabilities.setter
    def capabilities(self, value):
        self.capflags = capabilities.to_flags(value)


class VolumePool(CapabilitiesAwareModel):
    """ Something that joins a couple of BlockVolumes together. """
    pass


class AbstractVolume(CapabilitiesAwareModel):
    pool        = models.ForeignKey(VolumePool,  blank=True, null=True)
    volume_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volume_type_set")
    volume      = generic.GenericForeignKey("volume_type", "id")

    class Meta:
        abstract = True

    # Interface:
    # name -> CharField or property
    # megs -> IntegerField or property
    # disk_stats -> property


class BlockVolume(AbstractVolume):
    """ Everything that is a /dev/something. """
    upper_type  = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_upper_type_set")
    upper_id    = models.PositiveIntegerField(blank=True, null=True)
    upper       = generic.GenericForeignKey("upper_type", "upper_id")

    # Interface:
    # device -> CharField or property that returns /dev/path


class FileSystemVolume(AbstractVolume):
    """ Everything that can be mounted as a /media/something and is supposed to be able to be shared. """
    filesystem  = models.CharField(max_length=50)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    # Interface:
    # see FileSystemProvider


class FileSystemProvider(FileSystemVolume):
    """ A FileSystem that resides on top of a BlockVolume. """
    base        = models.ForeignKey(BlockVolume)

    def save(self, *args, **kwargs):
        FileSystemVolume.save(self, *args, **kwargs)
        self.base.upper = self
        self.base.save()

    @property
    def fs(self):
        return filesystems.get_by_name(self.filesystem)(self.base)

    @property
    def fsname(self):
        return self.fs.fsname

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


