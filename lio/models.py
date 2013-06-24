# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from os.path   import realpath
from rtslib.root   import RTSRoot
from rtslib        import target, tcm
from rtslib.utils  import generate_wwn

from django.db   import models
from django.conf import settings

from ifconfig.models import HostGroup, Host, IPAddress, HostDependentManager, getHostDependentManagerClass
from lvm.models      import LogicalVolume


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

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if not self.wwn:
            self.wwn = self.volume.uuid
        models.Model.save(self, *args, **kwargs)
        if install:
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").storage_object_create(self.id)


TARGET_TYPE_CHOICES = (
    ("iscsi",   "iscsi"),
    ("qla2xxx", "qla2xxx"),
)

class Target(models.Model):
    wwn         = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('wwn', 'host')]

    @property
    def lio_object(self):
        fabric = target.FabricModule(self.type)
        if not fabric.exists:
            raise SystemError("fabric not loaded")
        for lio_tgt in fabric.targets:
            if lio_tgt.wwn == self.wwn:
                return lio_tgt
        raise KeyError("Target not found")

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if not self.wwn:
            self.wwn = generate_wwn({
                'qla2xxx': 'free',
                'iscsi':   'iqn'
                }[self.type])
        models.Model.save(self, *args, **kwargs)
        if install:
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").target_create(self.id)


class Initiator(models.Model):
    host        = models.ForeignKey(Host)
    wwn         = models.CharField(max_length=250, unique=True)
    type        = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)


class Portal(models.Model):
    ipaddress   = models.ForeignKey(IPAddress)
    port        = models.IntegerField(default=3260)

    objects     = getHostDependentManagerClass("ipaddress__device__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = [('ipaddress', 'port')]

    @property
    def lio_object(self):
        r = RTSRoot()
        for lio_npt in r.network_portals:
            if lio_npt.ip_address == self.ipaddress.host_part and lio_npt.port == self.port:
                return lio_npt
        raise KeyError("Network Portal not found")


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

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            iface = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio")
            iface.tpg_create(self.id)


def __tpg_portals_changed(**kwargs):
    if kwargs["reverse"] or kwargs["action"] != "post_add":
        return
    tpg   = kwargs["instance"]
    iface = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio")
    for portal_id in kwargs["pk_set"]:
        iface.portal_create(portal_id, tpg.id)

models.signals.m2m_changed.connect(__tpg_portals_changed, sender=TPG.portals.through)


class ACL(models.Model):
    tpg         = models.ForeignKey(TPG)
    initiator   = models.ForeignKey(Initiator)

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

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").acl_create(self.id)


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

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lio").lun_create(self.id)




class LogicalLUN(models.Model):
    """ Mainmächtiges masterchief ultramodel of doom """
    volume      = models.ForeignKey(LogicalVolume, unique=True)
    type        = models.CharField(max_length=10, choices=TARGET_TYPE_CHOICES)
    lun_id      = models.IntegerField(unique=True)
    hostgroups  = models.ManyToManyField(HostGroup)
    hosts       = models.ManyToManyField(Host)
    targets     = models.ManyToManyField(Target)


def __logicallun_hostgroups_changed(**kwargs):
    if kwargs["reverse"]:
        return
    host_ids = set()
    for hostgrp_id in kwargs["pk_set"]:
        hostgrp = HostGroup.objects.get(id=hostgrp_id)
        for host in hostgrp.hosts.all():
            host_ids.add(host.id)
    kwargs["pk_set"] = list(host_ids)
    __logicallun_hosts_changed(**kwargs)

models.signals.m2m_changed.connect(__logicallun_hostgroups_changed, sender=LogicalLUN.hostgroups.through)


def __logicallun_hosts_changed(**kwargs):
    if kwargs["reverse"] or kwargs["action"] != "post_add":
        return
    llun  = kwargs["instance"]
    localhost = Host.objects.get_current()
    for target in llun.targets.filter(host=localhost):
        for tpg in target.tpgs.all():
            for host_id in kwargs["pk_set"]:
                host = Host.objects.get(id=host_id)
                for initator in host.initiator_set.filter(type=llun.type):
                    ACL.objects.get_or_create(tpg=tpg, initiator=initiator)

models.signals.m2m_changed.connect(__logicallun_hosts_changed, sender=LogicalLUN.hosts.through)


def __logicallun_targets_changed(**kwargs):
    if kwargs["reverse"] or kwargs["action"] != "post_add":
        return
    llun  = kwargs["instance"]
    localhost = Host.objects.get_current()
    storobj   = StorageObject.objects.get(volume=llun.volume)
    for target_id in kwargs["pk_set"]:
        try:
            target = Target.objects.get(id=target_id)
        except Target.DoesNotExist:
            continue # target is on a different host, no idea what we're doing in that case

        for tpg in target.tpgs.all():
            for hostgrp in llun.hostgroups.all():
                for host in hostgrp.hosts.all():
                    for initator in host.initiator_set.filter(type=llun.type):
                        ACL.objects.get_or_create(tpg=tpg, initiator=initiator)
            for host in llun.hosts.all():
                for initator in host.initiator_set.filter(type=llun.type):
                    ACL.objects.get_or_create(tpg=tpg, initiator=initiator)

            try:
                lun = LUN.objects.get( tpg=tpg, storageobj=storobj, logicallun=llun )
            except LUN.DoesNotExist:
                lun = LUN( tpg=tpg, storageobj=storobj, logicallun=llun, lun_id=llun.lun_id )
                lun.save()

models.signals.m2m_changed.connect(__logicallun_targets_changed, sender=LogicalLUN.targets.through)
