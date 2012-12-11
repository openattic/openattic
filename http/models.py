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

from os.path import join, exists, islink
from os import unlink, symlink, mkdir

from http.conf import settings as http_settings
from django.db import models

from ifconfig.models import getHostDependentManagerClass
from lvm.models import LogicalVolume

class Export(models.Model):
    volume      = models.ForeignKey(LogicalVolume, related_name="http_export_set")
    path        = models.CharField(max_length=255)

    objects     = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

    share_type  = "http"

    def __unicode__(self):
        return unicode( self.volume )

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        linkname = join(http_settings.VOLUMESDIR, self.volume.name)
        if not exists( linkname ):
            symlink( self.path, linkname )
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        linkname = join(http_settings.VOLUMESDIR, self.volume.name)
        if islink( linkname ):
            unlink( linkname )
        return ret
