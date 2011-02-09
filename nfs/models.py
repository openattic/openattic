# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import StatefulModel, LogicalVolume

class Export(StatefulModel):
    volume      = models.ForeignKey(LogicalVolume)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")

    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    @property
    def path(self):
        return self.volume.fs.mountpoint
