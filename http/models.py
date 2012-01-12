# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from os.path import join, exists, islink
from os import unlink, symlink

from http.conf import settings as http_settings
from django.db import models

from lvm.models import LogicalVolume

class Export(models.Model):
    volume      = models.ForeignKey(LogicalVolume, related_name="http_export_set")
    path        = models.CharField(max_length=255)

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
