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


class VolumePool(models.Model):
    content_type= models.ForeignKey(ContentType)
    object_id   = models.PositiveIntegerField()
    volumepool  = generic.GenericForeignKey()
    capflags    = models.BigIntegerField()

    objects     = CapabilitiesAwareManager()

    class Meta:
        unique_together = (('content_type', 'object_id'),)

    def __unicode__(self):
        return unicode(self.volumepool)

class AbstractVolume(models.Model):
    content_type= models.ForeignKey(ContentType)
    object_id   = models.PositiveIntegerField()
    volume      = generic.GenericForeignKey()
    capflags    = models.BigIntegerField()
    pool        = models.ForeignKey(VolumePool, blank=True, null=True)

    objects     = CapabilitiesAwareManager()

    class Meta:
        abstract = True
        unique_together = (('content_type', 'object_id'),)

    @property
    def capabilities(self):
        return capabilities.from_flags(self.capflags)

    @capabilities.setter
    def capabilities(self, value):
        self.capflags = capabilities.to_flags(value)

    @property
    def name(self):
        return self.volume.name

    @property
    def megs(self):
        return self.volume.megs

    @property
    def disk_stats(self):
        return self.volume.disk_stats

    def __unicode__(self):
        return unicode(self.volume)


class BlockVolume(AbstractVolume):
    fsvolume    = models.ForeignKey("FileSystemVolume", blank=True, null=True)

    @property
    def device(self):
        return self.volume.device

class FileSystemVolume(AbstractVolume):
    filesystem  = models.CharField(max_length=50)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    def save(self, *args, **kwargs):
        AbstractVolume.save(self, *args, **kwargs)
        if isinstance(self.volume, BlockVolume):
            self.volume.fsvolume = self
            self.volume.save()

    @property
    def fs(self):
        return filesystems.get_by_name(self.filesystem)(self.volume)

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

    def stat(self):
        return self.fs.stat()
