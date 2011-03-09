# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import StatefulModel, LogicalVolume

class Export(StatefulModel):
    volume      = models.ForeignKey(LogicalVolume, related_name="http_export_set")

    share_type  = "http"

    def __unicode__(self):
        return unicode( self.volume )

    @property
    def path(self):
        return self.volume.fs.mountpoint
