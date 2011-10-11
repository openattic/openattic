# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from os.path import join, exists, islink
from os import unlink, symlink

from django.conf import settings
from django.db   import models

from lvm.models import StatefulModel, LogicalVolume

class Export(StatefulModel):
    volume      = models.ForeignKey(LogicalVolume, related_name="http_export_set")
    path        = models.CharField(max_length=255)

    share_type  = "http"

    def __unicode__(self):
        return unicode( self.volume )

    def save( self, *args, **kwargs ):
        self.state = "active"
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)
        linkname = join(settings.PROJECT_ROOT, "http", "volumes", self.volume.name)
        if not exists( linkname ):
            symlink( self.path, linkname )
        return ret

    def delete( self ):
        self.state = "done"
        ret = StatefulModel.delete(self)
        linkname = join(settings.PROJECT_ROOT, "http", "volumes", self.volume.name)
        if islink( linkname ):
            unlink( linkname )
        return ret
