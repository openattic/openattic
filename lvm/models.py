# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.filesystems import FILESYSTEMS, get_by_name as get_fs_by_name
from lvm.procutils   import lvm_vgs, lvm_lvs

SETUP_STATE_CHOICES = (
    ("new",     "[new]     Installation ordered, but has not yet started"),
    ("pending", "[pending] Installation is running"),
    ("active",  "[active]  Installation has finished"),
    ("delete",  "[delete]  Removal ordered, but has not yet started"),
    ("dpend",   "[dpend]   Removal is running"),
    ("done",    "[done]    Removal has finished")
    )

class VolumeGroup(models.Model):
    name        = models.CharField(max_length=130, unique=True)

    def __unicode__(self):
        return self.name

    @property
    def lvm_info(self):
        return lvm_vgs()[self.name]

class LogicalVolume(models.Model):
    name        = models.CharField(max_length=130, unique=True)
    megs        = models.IntegerField()
    vg          = models.ForeignKey(VolumeGroup)
    snapshot    = models.ForeignKey("self", blank=True, null=True)
    filesystem  = models.CharField(max_length=20, blank=True, null=True,
                    choices=[(fs.name, fs.desc) for fs in FILESYSTEMS] )
    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._fs = None

    @property
    def path(self):
        return "/dev/%s/%s" % ( self.vg.name, self.name )

    @property
    def fs(self):
        if not self.filesystem:
            return None
        else:
            if self._fs is None:
                self._fs = get_fs_by_name(self.filesystem)(self)
            return self._fs

    def __unicode__(self):
        return self.name

    def get_shares( self, app_label=None ):
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if app_label  and relobj.model._meta.app_label != app_label:
                continue;

            for relmdl in relobj.model.objects.filter( **{ relobj.field.name: self } ):
                yield relmdl

    @property
    def lvm_info(self):
        if self.state != "active":
            return None
        return lvm_lvs()[self.name]
