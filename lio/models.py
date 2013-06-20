# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from os.path   import realpath
from rtslib.root   import RTSRoot
from rtslib.target import FabricModule

from django.db import models

from ifconfig.models import Host, IPAddress
from lvm.models import LogicalVolume


class Backstore(models.Model):
    name        = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=(
                    ("fileio", "fileio"),
                    ("iblock", "iblock"),
                  ))

    @property
    def lio_object(self):
        r = RTSRoot()
        for lio_bs in r.backstores:
            if lio_bs.name == self.name:
                return lio_bs
        raise KeyError("Backstore not found")


class StorageObject(models.Model):
    backstore   = models.ForeignKey(Backstore)
    volume      = models.ForeignKey(LogicalVolume)
    wwn         = models.CharField(max_length=250, blank=True)

    @property
    def lio_object(self):
        lio_bs = self.backstore.lio_object
        for lio_so in lio_bs.storage_objects:
            if lio_so.wwn == self.wwn:
                return lio_so
        raise KeyError("Storage Object not found")


class Target(models.Model):
    wwn         = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=(
                    ("iscsi",   "iscsi"),
                    ("qla2xxx", "qla2xxx"),
                  ))

    @property
    def lio_object(self):
        fabric = FabricModule(self.type)
        if not fabric.exists:
            raise SystemError("fabric not loaded")
        for lio_tgt in fabric.targets:
            if lio_tgt.wwn == self.wwn:
                return lio_tgt
        raise KeyError("Target not found")


class Initiator(models.Model):
    host        = models.ForeignKey(Host)
    wwn         = models.CharField(max_length=250)


class Portal(models.Model):
    ipaddress   = models.ForeignKey(IPAddress)
    port        = models.IntegerField(default=3260)

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
    portals     = models.ManyToManyField(Portal, blank=True, null=True)
    chapauth    = models.BooleanField(default=False)

    @property
    def lio_object(self):
        lio_tgt = self.target.lio_object
        for lio_tpg in lio_tgt.tpgs:
            if lio_tpg.tag == self.tag:
                return lio_tpg
        raise KeyError("Target Portal Group not found")


class ACL(models.Model):
    tpg         = models.ForeignKey(TPG)
    initiator   = models.ForeignKey(Initiator)

    @property
    def lio_object(self):
        lio_tpg = self.tpg.lio_object
        for lio_acl in lio_tpg.node_acls:
            if lio_acl.node_wwn == self.initiator.wwn:
                return lio_acl
        raise KeyError("ACL not found")


class LUN(models.Model):
    tpg         = models.ForeignKey(TPG)
    storageobj  = models.ForeignKey(StorageObject)
    lun_id      = models.IntegerField()

    @property
    def lio_object(self):
        lio_tpg = self.tpg.lio_object
        for lio_lun in lio_tpg.luns:
            if realpath(lio_lun.storage_object.udev_path) == self.storageobj.volume.dmdevice:
                return lio_lun
        raise KeyError("LUN not found")


