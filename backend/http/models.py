# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

from os.path import join, exists, islink
from os import unlink, symlink

from http.conf import settings as http_settings
from django.db import models

from ifconfig.models import getHostDependentManagerClass
from volumes.models import FileSystemVolume

class Export(models.Model):
    volume      = models.ForeignKey(FileSystemVolume, related_name="http_export_set")
    path        = models.CharField(max_length=255)

    objects     = getHostDependentManagerClass("volume__storageobj__host")()
    all_objects = models.Manager()

    share_type  = "http"

    def __unicode__(self):
        return self.volume.storageobj.name

    @property
    def url(self):
        return "/volumes/%s" % self.volume.storageobj.name

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        linkname = join(http_settings.VOLUMESDIR, self.volume.storageobj.name)
        if not exists( linkname ):
            symlink( self.path, linkname )
        return ret

def __export_pre_delete(instance, **kwargs):
    linkname = join(http_settings.VOLUMESDIR, instance.volume.storageobj.name)
    if islink( linkname ):
        unlink( linkname )

models.signals.pre_delete.connect(__export_pre_delete, sender=Export)

