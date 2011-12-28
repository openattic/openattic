# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings
from django.utils.translation   import ugettext_noop, ugettext_lazy as _

from lvm.models  import StatefulModel, LogicalVolume
from lvm.signals import post_shrink, post_grow
from ifconfig.models import IPAddress

class Initiator(models.Model):
    name        = models.CharField(max_length=50,  unique=True)
    address     = models.CharField(max_length=250, unique=True)

    def __unicode__(self):
        return self.name

class Target(models.Model):
    name        = models.CharField(max_length=250, help_text=_("Human readable name."))
    iscsiname   = models.CharField(max_length=250, help_text=_("ISCSI Target name (e.g. 'iqn.2011-01.storage:sto1')."))
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

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.volume.filesystem:
            raise ValidationError('This share type can not be used on volumes with a file system.')

    def iet_add(self, jid=-1):
        self.target._iscsi.lun_new( self.target.tid, self.number, self.volume.path, self.ltype, jid )

    def iet_delete(self, jid=-1):
        self.target._iscsi.lun_delete(self.target.tid, self.number, jid)

    def save(self, *args, **kwargs):
        if self.number == -1:
            try:
                self.number = max( [ rec['number'] for rec in Lun.objects.values('number') ] ) + 1
            except ValueError: # first LUN, so the list is empty
                self.number = 0

        if self.id is None and not self.volume.standby:
            self.iet_add()

        self.state = "active"
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)
        self.target._iscsi.writeconf()
        return ret

    def delete( self ):
        self.state = "done"
        volume = self.volume
        ret = StatefulModel.delete(self)
        if not volume.standby:
            self.iet_delete()
        self.target._iscsi.writeconf()
        return ret


def lv_resized(sender, **kwargs):
    for lun in Lun.objects.filter(volume=sender):
        lun.iet_delete(int(kwargs["jid"]))
        lun.iet_add(int(kwargs["jid"]))

post_shrink.connect(lv_resized)
post_grow.connect(lv_resized)
