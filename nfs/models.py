# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume, SETUP_STATE_CHOICES

class Export(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")
    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    @property
    def path(self):
        return self.volume.fs.mountpoint
