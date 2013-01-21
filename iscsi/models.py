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

import dbus

from time import time, sleep
from django.db   import models
from django.conf import settings
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _

from peering.models import PeerHost
from lvm.models  import LogicalVolume
import lvm.signals as lvm_signals
from ifconfig.models import IPAddress, getHostDependentManagerClass
from systemd.helpers import dbus_to_python

class Initiator(models.Model):
    name        = models.CharField(max_length=50,  unique=True)
    address     = models.CharField(max_length=250, unique=True)
    peer        = models.ForeignKey(PeerHost, null=True, blank=True)

    def __unicode__(self):
        return self.name


class TargetManager(models.Manager):
    def get_query_set(self):
        # return empty targets and those with our LUNs
        return super(TargetManager, self).get_query_set().filter(Q(lun__isnull=True) | Q(lun__in=Lun.objects.all()))


class Target(models.Model):
    name        = models.CharField(max_length=250, help_text=_("Human readable name."))
    iscsiname   = models.CharField(max_length=250, help_text=_("ISCSI Target name (e.g. 'iqn.2011-01.storage:sto1')."))
    init_allow  = models.ManyToManyField(Initiator, related_name="allowed_targets", blank=True)
    init_deny   = models.ManyToManyField(Initiator, related_name="denied_targets",  blank=True)
    tgt_allow   = models.ManyToManyField(IPAddress, related_name="allowed_targets", blank=True)

    objects     = TargetManager()
    all_objects = models.Manager()

    def __init__(self, *args, **kwargs):
        models.Model.__init__(self, *args, **kwargs)
        self._iscsi_obj = None

    @property
    def _iscsi(self):
        if self._iscsi_obj is None:
            self._iscsi_obj = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/iscsi")
        return self._iscsi_obj

    @property
    def tid(self):
        tgt = self._iscsi.get_targets()
        if self.iscsiname in tgt:
            return int(tgt[self.iscsiname]["tid"])
        return None

    @property
    def sessions(self):
        ses = self._iscsi.get_sessions()
        if self.iscsiname in ses:
            return dbus_to_python(ses[self.iscsiname])
        return {}

    @property
    def volumes(self):
        vol = self._iscsi.get_volumes()
        if self.iscsiname in vol:
            return dbus_to_python(vol[self.iscsiname])
        return {}

    def __unicode__(self):
        return self.name

    def install(self):
        return self._iscsi.target_new(0, self.iscsiname)

    def uninstall(self):
        self._iscsi.target_delete(self.tid)

    def save(self, *args, **kwargs):
        ret = models.Model.save(self, *args, **kwargs)
        if self.lun_set.count() != 0:
            self._iscsi.writeconf()
        return ret

    def delete(self, *args, **kwargs):
        for lun in self.lun_set.all():
            lun.delete()
        return models.Model.delete(self, *args, **kwargs)

class Lun(models.Model):
    target      = models.ForeignKey(Target)
    volume      = models.ForeignKey(LogicalVolume)
    number      = models.IntegerField( default=-1 )
    alias       = models.CharField(max_length=20, blank=True)
    ltype       = models.CharField(max_length=10, default="fileio",
                    choices=(("fileio", "fileio"), ("blockio", "blockio")))

    share_type  = "iscsi"
    objects     = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

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

    def install(self, jid=-1):
        sn = self.volume.lvm_info["LVM2_LV_UUID"][:16]
        self.target._iscsi.lun_new( self.target.tid, self.number, self.volume.path, self.ltype, sn, jid )

    def uninstall(self, jid=-1):
        self.target._iscsi.lun_delete(self.target.tid, self.number, jid)

    def save(self, *args, **kwargs):
        if self.target.lun_set.count() == 0 and self.target.tid is None:
            self.target.install()

        if self.number == -1:
            try:
                self.number = max( [ rec['number'] for rec in Lun.objects.values('number') ] ) + 1
            except ValueError: # first LUN, so the list is empty
                self.number = 0

        if self.id is None and not self.volume.standby:
            self.install()

        ret = models.Model.save(self, *args, **kwargs)
        self.target._iscsi.writeconf()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        if not self.volume.standby:
            self.uninstall()
        self.target._iscsi.writeconf()
        if self.target.lun_set.count() == 0 and self.target.tid is not None:
            self.target.uninstall()
        return ret


class ChapUser(models.Model):
    target      = models.ForeignKey(Target)
    username    = models.CharField( max_length=50 )
    passwd      = models.CharField( max_length=50 )
    usertype    = models.CharField( max_length=50, choices=(("IncomingUser", "incoming"), ("OutgoingUser", "outgoing")) )

    class Meta:
        unique_together = [("target", "username", "usertype")]

    def save(self, *args, **kwargs):
        if self.id is None:
            self.target._iscsi.target_new_user(self.target.tid, self.usertype, self.username, self.passwd)

        ret = models.Model.save(self, *args, **kwargs)
        self.target._iscsi.writeconf()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        self.target._iscsi.target_delete_user(self.target.tid, self.usertype, self.username)
        self.target._iscsi.writeconf()
        return ret


def lv_resized(sender, **kwargs):
    for lun in Lun.objects.filter(volume=sender):
        lun.uninstall(int(kwargs["jid"]))
        lun.install(int(kwargs["jid"]))

def vg_activated(sender, **kwargs):
    for target in Target.objects.filter(lun__volume__vg=sender):
        print target.name
        if target.tid is None:
            target.install()
        volpaths = [vol["path"] for vol in target.volumes]
        for lun in target.lun_set.all():
            if lun.volume.path not in volpaths:
                lun.install()

    print "Activated iSCSI targets for", sender

def vg_deactivated(sender, **kwargs):
    for target in Target.objects.filter(lun__volume__vg=sender):
        if target.tid is None:
            continue
        print target.name
        # Kill Sessions
        start = time()
        while time() - start < 10:
            sessions = target.sessions
            if not sessions:
                break
            for session in sessions:
                print "Killing connection %s:%s..." % (session["initiator"], session["cid"])
                target._iscsi.conn_delete(session["tid"], session["sid"], session["cid"])
        # Remove LUNs
        volpaths = [vol["path"] for vol in target.volumes]
        for lun in target.lun_set.all():
            if lun.volume.path in volpaths:
                start = time()
                while time() - start < 10:
                    try:
                        lun.uninstall()
                    except dbus.exceptions.DBusException, err:
                        if "Device or resource busy" not in err.args[0]:
                            raise
                        sleep(0.2)
                    else:
                        break
        # Remote Target
        start = time()
        while time() - start < 10:
            try:
                target.uninstall()
            except dbus.exceptions.DBusException, err:
                if "Device or resource busy" not in err.args[0]:
                    raise
                sleep(0.2)
            else:
                break

    print "Deactivated iSCSI targets for", sender

lvm_signals.post_shrink.connect(lv_resized)
lvm_signals.post_grow.connect(lv_resized)

lvm_signals.post_activate.connect(vg_activated)
lvm_signals.pre_deactivate.connect(vg_deactivated)
