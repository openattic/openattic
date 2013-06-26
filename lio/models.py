# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2013, it-novum GmbH <community@open-attic.org>
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

from os.path   import realpath
from rtslib        import target, tcm
from rtslib.utils  import generate_wwn

from django.db   import models
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from ifconfig.models import HostGroup, Host, IPAddress, HostDependentManager, getHostDependentManagerClass
from lvm.models      import LogicalVolume

# This import is not actually needed for the name, but since Django only imports
# the models, we need to make sure the filesystemproxy module has been loaded by Python.
import filesystemproxy



#                          ┌┬──────────────────────────┬┐
#                          ├┼──────────────────────────┼┤
#                          ││         SRS MODELS       ││
#                          ├┼──────────────────────────┼┤
#                          └┴──────────────────────────┴┘
#
#
#
#
#             ┌──────────────────────  LogicalLUN ═══════╦═══════════╗
#             │                        ↑   ║             ║           ║
#             │                        │   ║             ║           ⇓
#             │                        │   ║             ║         HostGroup
#             │                  ┌─────┘   ║             ║           ║
#             │                  │         ║             ║           ║
#             ↓                  │         ⇓             ║           ⇓
#      VG <── LV                 │       Target ─────────╩═══════> Host <──┬───────┐
#      │      ↑                  │         ↑                         ↑     │       │
#      │      │                  │         │                         │     │       │
#      │      │                  │         │                         │     │       │
#      │    StorageObject <──── LUN ────> TPG <──── ACL ────> Initiator    │       │
#      ↓      │                            ║                               │       │
#      │      ↓                            ⇓                               │       │
#      │    Backstore                     Portal ────> IPAddress ────> NetDevice   │
#      │      │                                                                    │
#      └──────┴────────────────>───────────────────────────────────────────────────┘
#
#
#
#  ┌┬──────────────────────────┬┐
#  ├┼──────────────────────────┼┤
#  ││ ─────> ForeignKey        ││
#  ││ ═════> ManyToManyField   ││
#  ├┼──────────────────────────┼┤
#  └┴──────────────────────────┴┘



pre_install     = models.signals.Signal()
post_install    = models.signals.Signal()

pre_uninstall   = models.signals.Signal()
post_uninstall  = models.signals.Signal()



class Backstore(models.Model):
    store_id    = models.IntegerField()
    type        = models.CharField(max_length=10, choices=(
                    ("fileio", "fileio"),
                    ("iblock", "iblock"),
                  ))
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('store_id', 'host')]

    @property
    def lio_object(self):
        if self.type == "iblock":
            return tcm.IBlockBackstore(self.store_id)
        else:
            return tcm.FileIOBackstore(self.store_id)

    def __unicode__(self):
        return "%d (%s)" % (self.store_id, self.type)

def __backstore_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=Backstore, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").backstore_delete(instance.id)
    post_uninstall.send(sender=Backstore, instance=instance)

models.signals.pre_delete.connect(__backstore_pre_delete, sender=Backstore)



class StorageObject(models.Model):
    backstore   = models.ForeignKey(Backstore)
    volume      = models.ForeignKey(LogicalVolume)
    wwn         = models.CharField(max_length=250, blank=True)

    objects     = getHostDependentManagerClass("backstore__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('backstore', 'volume')]

    @property
    def lio_object(self):
        lio_bs = self.backstore.lio_object
        for lio_so in lio_bs.storage_objects:
            if lio_so.wwn == self.wwn:
                return lio_so
        raise KeyError("Storage Object not found")

    def __unicode__(self):
        return "/backstores/%s/%s" % (self.backstore.type, self.volume.name)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if not self.wwn:
            self.wwn = self.volume.uuid
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=StorageObject, instance=self)
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").storage_object_create(self.id)
            post_install.send(sender=StorageObject, instance=self)

def __storage_object_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=StorageObject, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").storage_object_delete(instance.id)
    post_uninstall.send(sender=StorageObject, instance=instance)

models.signals.pre_delete.connect(__storage_object_pre_delete, sender=StorageObject)



TARGET_TYPE_CHOICES = (
    ("iscsi",   "iscsi"),
    ("qla2xxx", "qla2xxx"),
)

class Target(models.Model):
    name        = models.CharField(max_length=250, help_text=_("Human readable name."))
    wwn         = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('wwn', 'host')]

    @property
    def lio_object(self):
        fabric = target.FabricModule(unicode(self.type))
        if not fabric.exists:
            raise SystemError("fabric not loaded")
        for lio_tgt in fabric.targets:
            if lio_tgt.wwn == self.wwn:
                return lio_tgt
        raise KeyError("Target not found")

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if not self.wwn:
            self.wwn = generate_wwn({
                'qla2xxx': 'free',
                'iscsi':   'iqn'
                }[self.type])
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=Target, instance=self)
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").target_create(self.id)
            post_install.send(sender=Target, instance=self)

def __target_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=Target, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").target_delete(instance.id)
    post_uninstall.send(sender=Target, instance=instance)

models.signals.pre_delete.connect(__target_pre_delete, sender=Target)


class Initiator(models.Model):
    host        = models.ForeignKey(Host)
    wwn         = models.CharField(max_length=250, unique=True)
    type        = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)

    def __unicode__(self):
        return "%s (%s: %s)" % (self.host.name, self.type, self.wwn)


class Portal(models.Model):
    ipaddress   = models.ForeignKey(IPAddress)
    port        = models.IntegerField(default=3260)

    objects     = getHostDependentManagerClass("ipaddress__device__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('ipaddress', 'port')]

    def __unicode__(self):
        return "%s:%d" % (self.ipaddress.host_part, self.port)


class TPG(models.Model):
    tag         = models.IntegerField()
    target      = models.ForeignKey(Target)
    portals     = models.ManyToManyField(Portal)
    chapauth    = models.BooleanField(default=False)

    objects     = getHostDependentManagerClass("target__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('tag', 'target')]

    @property
    def lio_object(self):
        lio_tgt = self.target.lio_object
        for lio_tpg in lio_tgt.tpgs:
            if lio_tpg.tag == self.tag:
                return lio_tpg
        raise KeyError("Target Portal Group not found")

    def __unicode__(self):
        return "%s/tpgt%d" % (self.target, self.tag)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=TPG, instance=self)
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").tpg_create(self.id)
            post_install.send(sender=TPG, instance=self)

def __tpg_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=TPG, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").tpg_delete(instance.id)
    post_uninstall.send(sender=TPG, instance=instance)

models.signals.pre_delete.connect(__tpg_pre_delete, sender=TPG)

def __tpg_portals_changed(instance, reverse, action, pk_set, **kwargs):
    iface = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio")
    if not reverse:
        tpgs    = [instance]
        portals = Portal.objects.filter(id__in=pk_set)
    else:
        tpgs    = TPG.objects.filter(id__in=pk_set)
        portals = [instance]
    for tpg in tpgs:
        for portal in portals:
            if action == "post_add":
                iface.portal_create(portal.id, tpg.id)
            elif action == "pre_remove":
                iface.portal_delete(portal.id, tpg.id)

models.signals.m2m_changed.connect(__tpg_portals_changed, sender=TPG.portals.through)


class LUN(models.Model):
    tpg         = models.ForeignKey(TPG)
    storageobj  = models.ForeignKey(StorageObject)
    lun_id      = models.IntegerField()
    logicallun  = models.ForeignKey("LogicalLUN", blank=True, null=True)

    objects     = getHostDependentManagerClass("storageobj__backstore__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('tpg', 'storageobj'), ('logicallun', 'storageobj'), ('logicallun', 'tpg')]

    @property
    def lio_object(self):
        lio_tpg = self.tpg.lio_object
        for lio_lun in lio_tpg.luns:
            if realpath(lio_lun.storage_object.udev_path) == self.storageobj.volume.dmdevice:
                return lio_lun
        raise KeyError("LUN not found")

    def __unicode__(self):
        return "%s/luns/lun%d (%s)" % (self.tpg, self.lun_id, self.storageobj.volume.name)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=LUN, instance=self)
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").lun_create(self.id)
            post_install.send(sender=LUN, instance=self)

def __lun_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=LUN, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").lun_delete(instance.id)
    post_uninstall.send(sender=LUN, instance=instance)

models.signals.pre_delete.connect(__lun_pre_delete, sender=LUN)


class ACL(models.Model):
    tpg         = models.ForeignKey(TPG)
    initiator   = models.ForeignKey(Initiator)
    mapped_luns = models.ManyToManyField(LUN)

    objects     = getHostDependentManagerClass("tpg__target__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('tpg', 'initiator')]

    @property
    def lio_object(self):
        lio_tpg = self.tpg.lio_object
        for lio_acl in lio_tpg.node_acls:
            if lio_acl.node_wwn == self.initiator.wwn:
                return lio_acl
        raise KeyError("ACL not found")

    def __unicode__(self):
        return "%s/acls/%s" % (self.tpg, self.initiator.wwn)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=ACL, instance=self)
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").acl_create(self.id)
            post_install.send(sender=ACL, instance=self)

def __acl_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=ACL, instance=instance)
    dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").acl_delete(instance.id)
    post_uninstall.send(sender=ACL, instance=instance)

models.signals.pre_delete.connect(__acl_pre_delete, sender=ACL)

def __acl_mappedluns_changed(instance, reverse, action, pk_set, **kwargs):
    iface = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio")
    if not reverse:
        acls = [instance]
        luns = LUN.objects.filter(id__in=pk_set)
    else:
        acls = ACL.objects.filter(id__in=pk_set)
        luns = [instance]
    for acl in acls:
        for lun in luns:
            if action == "post_add":
                iface.lun_map(lun.id, acl.id)
            elif action == "pre_remove":
                iface.lun_unmap(lun.id, acl.id)

models.signals.m2m_changed.connect(__acl_mappedluns_changed, sender=ACL.mapped_luns.through)


class LogicalLUN(models.Model):
    """ Mainmächtiges masterchief ultramodel of doom """
    volume      = models.ForeignKey(LogicalVolume, unique=True)
    lun_id      = models.IntegerField(unique=True)
    hostgroups  = models.ManyToManyField(HostGroup)
    hosts       = models.ManyToManyField(Host)
    targets     = models.ManyToManyField(Target)

    def __unicode__(self):
        return "%s" % (self.volume.name)


def __logicallun_hostgroups_changed(instance, reverse, action, pk_set, **kwargs):
    """ A HostGroup has been added to or removed from a LLUN.

        This case is equivalent to each host being added or removed individually.
    """
    if action not in ("post_add", "pre_remove"):
        return
    if not reverse:
        lluns      = [instance]
        hostgroups = HostGroup.objects.filter(id__in=pk_set)
    else:
        lluns      = LogicalLUN.objects.filter(id__in=pk_set)
        hostgroups = [instance]
    for llun in lluns:
        host_ids = set()
        for hostgrp in hostgroups:
            for host in hostgrp.hosts.all():
                host_ids.add(host.id)
        __logicallun_hosts_changed(instance=llun, reverse=False, action=action, pk_set=host_ids)

models.signals.m2m_changed.connect(__logicallun_hostgroups_changed, sender=LogicalLUN.hostgroups.through)


def __acl_add_or_delete(tpg, initiator, action):
    """ See if an ACL exists for a given TPG and Initiator, see if it should,
        and add/delete it accordingly.
    """
    try:
        acl = ACL.objects.get(tpg=tpg, initiator=initiator)
    except ACL.DoesNotExist:
        if action == "post_add":
            acl = ACL(tpg=tpg, initiator=initiator)
            acl.save()
    else:
        if action == "pre_remove":
            acl.delete()

def __logicallun_hosts_changed(instance, reverse, action, pk_set, **kwargs):
    """ A Host has been added to or removed from a LLUN. """
    if action not in ("post_add", "pre_remove"):
        return

    if not reverse:
        lluns = [instance]
        hosts = Host.objects.filter(id__in=pk_set)
    else:
        lluns = LogicalLUN.objects.filter(id__in=pk_set)
        hosts = [instance]

    localhost = Host.objects.get_current()

    for llun in lluns:
        for tgt in llun.targets.filter(host=localhost):
            for tpg in tgt.tpg_set.all():
                for host in hosts:
                    for initiator in host.initiator_set.filter(type=tgt.type):
                        __acl_add_or_delete(tpg, initiator, action)


models.signals.m2m_changed.connect(__logicallun_hosts_changed, sender=LogicalLUN.hosts.through)


def __hostgroup_hosts_changed(instance, reverse, action, pk_set, **kwargs):
    """ A host has been added to or removed from a HostGroup.

        See if any LLUNs are using the HostGroup. For those, this is
        equivalent to the host being added or removed individually.
    """
    if reverse or action not in ("post_add", "pre_remove"):
        return

    if not reverse:
        hostgroups = [instance]
        host_pks   = pk_set
    else:
        hostgroups = HostGroup.objects.filter(id__in=pk_set)
        host_pks   = set([instance.id])

    for hostgrp in hostgroups:
        for llun in hostgrp.logicallun_set.all():
            __logicallun_hosts_changed(instance=llun, reverse=False, action=action, pk_set=host_pks)

models.signals.m2m_changed.connect(__hostgroup_hosts_changed, sender=HostGroup.hosts.through)


def __logicallun_targets_changed(instance, reverse, action, pk_set, **kwargs):
    """ A Target has been added to or removed from a LLUN. """
    if action not in ("post_add", "pre_remove"):
        return

    if not reverse:
        lluns   = [instance]
        targets = Target.objects.filter(id__in=pk_set)
    else:
        lluns   = LogicalLUN.objects.filter(id__in=pk_set)
        targets = [instance]

    localhost = Host.objects.get_current()

    for llun in lluns:
        try:
            storobj = StorageObject.objects.get(volume=llun.volume)
        except StorageObject.DoesNotExist:
            bstore  = Backstore(type="iblock", store_id=llun.lun_id, host=localhost)
            bstore.save()
            storobj = StorageObject(backstore=bstore, volume=llun.volume, wwn=llun.volume.uuid)
            storobj.save()

        for tgt in targets:
            for tpg in tgt.tpg_set.all():
                for hostgrp in llun.hostgroups.all():
                    for host in hostgrp.hosts.all():
                        for initiator in host.initiator_set.filter(type=tgt.type):
                            __acl_add_or_delete(tpg, initiator, action)
                for host in llun.hosts.all():
                    for initiator in host.initiator_set.filter(type=tgt.type):
                        __acl_add_or_delete(tpg, initiator, action)

                try:
                    lun = LUN.objects.get( tpg=tpg, storageobj=storobj, logicallun=llun )
                except LUN.DoesNotExist:
                    if action == "post_add":
                        lun = LUN( tpg=tpg, storageobj=storobj, logicallun=llun, lun_id=llun.lun_id )
                        lun.save()
                else:
                    if action == "pre_remove":
                        lun.delete()

models.signals.m2m_changed.connect(__logicallun_targets_changed, sender=LogicalLUN.targets.through)


def __tpg_added(instance, **kwargs):
    """ A TPG has been added to a target.

        This case is equivalent to a Target being added to a LLUN.
    """
    for llun in instance.target.logicallun_set.all():
        __logicallun_targets_changed(reverse=False, action="post_add", instance=llun, pk_set=[instance.target.id])

post_install.connect(__tpg_added, sender=TPG)


def __initiator_added(instance, **kwargs):
    """ An Initiator has been added to a Host.

        This case is equivalent to the host being added to a LLUN.
    """
    llun_ids = set()
    for hostgrp in instance.host.hostgroup_set.all():
        for llun in hostgrp.logicallun_set.values("id"):
            llun_ids.add(llun["id"])
    for llun in instance.host.logicallun_set.values("id"):
        llun_ids.add(llun["id"])
    for llun_id in llun_ids:
        llun = LogicalLUN.objects.get(id=llun_id)
        __logicallun_hosts_changed(reverse=False, action="post_add", instance=llun, pk_set=[instance.host.id])

models.signals.post_save.connect(__initiator_added, sender=Initiator)
