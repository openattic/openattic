# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings
from django.utils.translation   import ugettext_noop, ugettext_lazy as _

from lvm.models import StatefulModel, LogicalVolume
from ifconfig.models import IPAddress

class Initiator(models.Model):
    name        = models.CharField(max_length=50,  unique=True)
    address     = models.CharField(max_length=250, unique=True)

    def __unicode__(self):
        return self.name

class Target(models.Model):
    name        = models.CharField(max_length=250, help_text=_("Human readable name."))
    iscsiname   = models.CharField(max_length=250, help_text=_("ISCSI Target name (e.g. 'iqn.2011-01.storage:sto1')."))
    allowall    = models.BooleanField(default=True, blank=True, help_text=_("Sets the default action if both the allow and deny ACLs are empty. True = Allow all initiators to connect, False = deny all."))
    init_allow  = models.ManyToManyField(Initiator, related_name="allowed_targets", blank=True)
    init_deny   = models.ManyToManyField(Initiator, related_name="denied_targets",  blank=True)
    tgt_allow   = models.ManyToManyField(IPAddress, related_name="allowed_targets", blank=True)

    def __init__(self, *args, **kwargs):
        models.Model.__init__(self, *args, **kwargs)
        self._iscsi = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/iscsi")

    @property
    def tid(self):
        vol = self._iscsi.get_volumes()
        for tid in vol:
            if vol[tid][0] == self.iscsiname:
                return tid
        return None

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.id is None:
            self._iscsi.target_new(0, self.iscsiname)

        ret = models.Model.save(self, *args, **kwargs)
        self._iscsi.writeconf()
        return ret

    def delete( self ):
        iscsi = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/iscsi")
        ret = models.Model.delete(self)
        self._iscsi.target_delete(self.tid)
        self._iscsi.writeconf()
        return ret



class Lun(StatefulModel):
    target      = models.ForeignKey(Target)
    volume      = models.ForeignKey(LogicalVolume)
    number      = models.IntegerField( default=-1 )
    alias       = models.CharField(max_length=20, blank=True)
    ltype       = models.CharField(max_length=10, default="fileio",
                    choices=(("fileio", "fileio"), ("blockio", "blockio")))

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

        if self.id is None and not self.volume.standby:
            self.target._iscsi.lun_new( self.target.tid, self.number, self.volume.path, self.ltype )

        self.state = "active"
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)
        self.target._iscsi.writeconf()
        return ret

    def delete( self ):
        self.state = "done"
        volume = self.volume
        ret = StatefulModel.delete(self)
        if not volume.standby:
            self.target._iscsi.lun_delete(self.target.tid, self.number)
        self.target._iscsi.writeconf()
        return ret
