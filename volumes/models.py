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

from volumes import capabilities


class CapabilitiesAwareManager(models.Manager):
    def filter_by_capability(self, capability):
        return self.extra(where=[self.model._meta.db_table + '.capflags & %s = %s'], params=[capability.flag, capability.flag])


class AbstractVolume(models.Model):
    content_type= models.ForeignKey(ContentType)
    object_id   = models.PositiveIntegerField()
    volume      = generic.GenericForeignKey()
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

    @property
    def name(self):
        return self.volume.name

    @property
    def megs(self):
        return self.volume.megs

    @property
    def disk_stats(self):
        return self.volume.disk_stats


class BlockVolume(AbstractVolume):
    def device(self):
        return self.volume.device

class FileSystemVolume(AbstractVolume):
    filesystem  = models.CharField(max_length=50)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    def fs(self):
        return self.volume.fs

    def mountpoint(self):
        return self.fs.mountpoint

    def mounthost(self):
        return self.fs.mounthost

    def stat(self):
        return self.fs.stat()
