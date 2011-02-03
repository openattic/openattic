# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume, SETUP_STATE_CHOICES

class Initiator(models.Model):
    name        = models.CharField(max_length=50,  unique=True)
    address     = models.CharField(max_length=250, unique=True)

    def __unicode__(self):
        return self.name

class Target(models.Model):
    name        = models.CharField(max_length=250, help_text="Human readable name.")
    iscsiname   = models.CharField(max_length=250, help_text="ISCSI Target name (e.g. 'iqn.2011-01.storage:sto1').")
    allowall    = models.BooleanField(default=True, blank=True, help_text="Sets the default action if both the allow and deny ACLs are empty. True = Allow all initiators to connect, False = deny all.")
    init_allow  = models.ManyToManyField(Initiator, related_name="allowed_targets", blank=True)
    init_deny   = models.ManyToManyField(Initiator, related_name="denied_targets",  blank=True)

    def __unicode__(self):
        return self.name

class Lun(models.Model):
    target      = models.ForeignKey(Target)
    volume      = models.ForeignKey(LogicalVolume)
    number      = models.IntegerField( default=-1 )
    alias       = models.CharField(max_length=20, blank=True)
    ltype       = models.CharField(max_length=10, default="fileio",
                    choices=(("fileio", "fileio"), ("blockio", "blockio")))
    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    share_type  = "iscsi"

    class Meta:
        unique_together = [("target", "number")]

    @property
    def path(self):
        return self.volume.path

    def __unicode__(self):
        if self.alias:
            return "%s LUN %d (%s)" % ( self.target, self.number, self.alias )
        return "%s LUN %d" % ( self.target, self.number )

    def save(self, *args, **kwargs):
        if self.number == -1:
            try:
                self.number = max( [ rec['number'] for rec in Lun.objects.filter(target=self.target).values('number') ] ) + 1
            except ValueError: # first LUN, so the list is empty
                self.number = 0

        models.Model.save(self, *args, **kwargs)
