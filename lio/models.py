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

import socket
import os

from os.path   import realpath
from rtslib        import target, tcm
from rtslib.utils  import generate_wwn

from django.db   import models
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

from systemd import get_dbus_object
from ifconfig.models import HostGroup, Host, IPAddress, HostDependentManager, getHostDependentManagerClass
from volumes.models  import BlockVolume

# This import is not actually needed for the name, but since Django only imports
# the models, we need to make sure the filesystemproxy module has been loaded by Python.
import filesystemproxy


#
#
#      BackStore              ┌——————————— HostGroupACL ────> HostGroup
#         ↑                   │                                  │
#         |                   v                                  v
#      StorageObject ———> BlockVolume <——— HostACL ——————┐       │
#         ↑                   ┌────────────┘ |           │       │
#         |                   v              ↓           │       │
#        LUN —————┬————————> TPG ————————> Portal        │       │
#         ↑       │           ↑              |           │       │
#         |       │           |              v           │       │
#        ACL ─────┘         Target         IPAddress     │       │
#         |                   |              |           │       │
#         v                   v              v           │       │
#      Initiator            Host (oA) <——— NetDevice     │       v
#         │                                              │       │
#         └───────────────> Host (Initiator) <───────────┴───────┘
#
#


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
    get_dbus_object("/lio").backstore_delete(instance.id)
    post_uninstall.send(sender=Backstore, instance=instance)

models.signals.pre_delete.connect(__backstore_pre_delete, sender=Backstore)



class StorageObject(models.Model):
    backstore   = models.ForeignKey(Backstore)
    volume      = models.ForeignKey(BlockVolume)
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
        return "/backstores/%s/%s" % (self.backstore.type, unicode(self.volume.volume))

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if not self.wwn:
            self.wwn = self.volume.storageobj.uuid
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=StorageObject, instance=self)
            get_dbus_object("/lio").storage_object_create(self.id)
            post_install.send(sender=StorageObject, instance=self)

def __storage_object_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=StorageObject, instance=instance)
    get_dbus_object("/lio").storage_object_delete(instance.id)
    post_uninstall.send(sender=StorageObject, instance=instance)

def __storage_object_post_delete(instance, **kwargs):
    instance.backstore.delete()

models.signals.pre_delete.connect(__storage_object_pre_delete, sender=StorageObject)
models.signals.post_delete.connect(__storage_object_post_delete, sender=StorageObject)



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

    def full_clean(self, exclude=None, validate_unique=True):
        if not self.wwn:
            if self.type == "iscsi":
                # Generate IQN. the "prefix" part is shamelessly stolen from rtslib, but we use
                # the volume name instead of a random serial.
                localname = socket.gethostname().split(".")[0]
                localarch = os.uname()[4].replace("_", "")
                prefix = "iqn.2003-01.org.linux-iscsi.%s.%s" % (localname, localarch)
                prefix = prefix.strip().lower()
                self.wwn = "%s:%s" % (prefix, self.name.replace("_", "").replace(" ", ""))
            else:
                self.wwn = generate_wwn('free', self.type)
        models.Model.full_clean(self, exclude=exclude, validate_unique=validate_unique)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=Target, instance=self)
            get_dbus_object("/lio").target_create(self.id)
            post_install.send(sender=Target, instance=self)

def __target_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=Target, instance=instance)
    get_dbus_object("/lio").target_delete(instance.id)
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
            get_dbus_object("/lio").tpg_create(self.id)
            post_install.send(sender=TPG, instance=self)

def __tpg_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=TPG, instance=instance)
    get_dbus_object("/lio").tpg_delete(instance.id)
    post_uninstall.send(sender=TPG, instance=instance)

models.signals.pre_delete.connect(__tpg_pre_delete, sender=TPG)

def __tpg_portals_changed(instance, reverse, action, pk_set, **kwargs):
    iface = get_dbus_object("/lio")
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

    objects     = getHostDependentManagerClass("storageobj__backstore__host")()
    all_objects = models.Manager()

    @property
    def lio_object(self):
        lio_tpg = self.tpg.lio_object
        for lio_lun in lio_tpg.luns:
            if realpath(lio_lun.storage_object.udev_path) == realpath(self.storageobj.volume.volume.path):
                return lio_lun
        raise KeyError("LUN not found")

    def __unicode__(self):
        return "%s/luns/lun%d (%s)" % (self.tpg, self.lun_id, self.storageobj.volume.storageobj.name)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=LUN, instance=self)
            get_dbus_object("/lio").lun_create(self.id)
            post_install.send(sender=LUN, instance=self)

def __lun_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=LUN, instance=instance)
    get_dbus_object("/lio").lun_delete(instance.id)
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
            get_dbus_object("/lio").acl_create(self.id)
            post_install.send(sender=ACL, instance=self)

def __acl_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=ACL, instance=instance)
    get_dbus_object("/lio").acl_delete(instance.id)
    post_uninstall.send(sender=ACL, instance=instance)

models.signals.pre_delete.connect(__acl_pre_delete, sender=ACL)

def __acl_mappedluns_changed(instance, reverse, action, pk_set, **kwargs):
    iface = get_dbus_object("/lio")
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


def ctxupdate(ctx=None, **values):
    """ Create a new context dict and update its values. """
    if ctx is None:
        newctx = {}
    else:
        newctx = ctx.copy()
    newctx.update(values)
    return newctx

class ProtocolHandler(object):
    """ Handles protocol independent installation parts. """
    module = None

    @classmethod
    def install_hostacl(self, hostacl):
        # 0. Find eligible modules according to configured initiator attributes
        # 1. Find or create Target
        # 2. Find or create TPGs
        # 3. Find or create Portals
        # 4. Find or create LUNs
        # 5. Find or create Initiators
        # 6. Find or create ACL
        # 7. Find or create Mapped_LUN
        contexts = []
        for handler in ProtocolHandler.get_handlers(hostacl):
            for targetctx in handler.get_targets():
                for tpgctx in handler.get_tpgs(targetctx):
                    luncontexts = []
                    for lunctx in handler.get_luns(tpgctx):
                        for initiatorctx in handler.get_initiators(lunctx):
                            for aclctx in handler.get_acls(initiatorctx):
                                for mappedlunctx in handler.get_mapped_luns(aclctx):
                                    luncontexts.append(mappedlunctx)
                    portalcontexts = []
                    for portalctx in handler.get_portals(tpgctx):
                        portalcontexts.append(portalctx)
                    contexts.append((luncontexts, portalcontexts))
        return contexts

    @classmethod
    def uninstall_hostacl(self, hostacl):
        # if we're uninstalling the hostacl, it has been installed already, so
        # install_hostacl won't actually create any new objects but only
        # return a list of existing contexts. said list of contexts can then
        # be used to delete stuff.
        contexts = ProtocolHandler.install_hostacl(hostacl)
        # 0. Find eligible modules according to configured contexts
        for ctx in contexts:
            for handler in ProtocolHandler.get_handlers(hostacl):
                luncontexts, portalcontexts = ctx
                for lunctx in luncontexts:
                    if handler.module == lunctx["module"]:
                        handler.delete(lunctx)
        return contexts

    @classmethod
    def get_handlers(self, hostacl):
        """ Find eligible modules according to configured initiator attributes """
        inittypes = [v["type"] for v in hostacl.host.initiator_set.values("type").distinct()]
        # TODO: Check if FC is actually possible (Kernel ≥3.5, found HBAs)
        for HandlerClass in (IscsiHandler, FcHandler):
            if HandlerClass.module in inittypes:
                yield HandlerClass(hostacl)

    def __init__(self, hostacl):
        self.hostacl = hostacl

    def get_targets(self):
        raise NotImplementedError("get_targets")

    def get_tpgs(self, targetctx):
        raise NotImplementedError("get_tpgs")

    def get_portals(self, tpgctx):
        raise NotImplementedError("get_portals")

    def get_luns(self, tpgctx):
        """ Find or create the LUN.

            First, lookup the storage object used for the volume, creating it
            if it does not exist. Backstores are never shared between Storage
            Objects, so if a new SO is created, it creates a new BS as well.

            Second, we check if there is a LUN already sharing that SO, and
            if not, create one.
        """
        try:
            storageobj = StorageObject.objects.get(volume=self.hostacl.volume)
        except StorageObject.DoesNotExist:
            try:
                store_id = max( v["store_id"] for v in Backstore.objects.all().values("store_id") ) + 1
            except ValueError:
                store_id = 1
            backstore  = Backstore(store_id=store_id, type="iblock", host=Host.objects.get_current())
            backstore.full_clean()
            backstore.save()
            storageobj = StorageObject(backstore=backstore, volume=self.hostacl.volume, wwn=self.hostacl.volume.storageobj.uuid)
            storageobj.full_clean()
            storageobj.save()
        try:
            lun = LUN.objects.get(tpg=tpgctx["tpg"], storageobj=storageobj, lun_id=self.hostacl.lun_id)
        except LUN.DoesNotExist:
            lun = LUN(tpg=tpgctx["tpg"], storageobj=storageobj, lun_id=self.hostacl.lun_id)
            lun.full_clean()
            lun.save()
        yield ctxupdate(tpgctx, lun=lun)

    def get_initiators(self, lunctx):
        """ Yield all initiators that are meant to have access to the LUN. """
        for initr in Initiator.objects.filter(host=self.hostacl.host, type=self.module):
            yield ctxupdate(lunctx, initiator=initr)

    def get_acls(self, initiatorctx):
        """ Yield an ACL object for the given initiator. """
        try:
            acl = ACL.objects.get(tpg=initiatorctx["tpg"], initiator=initiatorctx["initiator"])
        except ACL.DoesNotExist:
            acl = ACL(tpg=initiatorctx["tpg"], initiator=initiatorctx["initiator"])
            acl.full_clean()
            acl.save()
        yield ctxupdate(initiatorctx, acl=acl)

    def get_mapped_luns(self, aclctx):
        """ Make sure the LUN is mapped in the given ACL and yield it. """
        if aclctx["lun"] not in aclctx["acl"].mapped_luns.all():
            aclctx["acl"].mapped_luns.add(aclctx["lun"])
        yield ctxupdate(aclctx, mapped_lun=aclctx["lun"])

    def delete(self, lunctx):
        self.delete_mapped_luns(lunctx)
        self.delete_acls(lunctx)
        self.delete_luns(lunctx)
        self.delete_targets(lunctx)

    def delete_mapped_luns(self, lunctx):
        """ Unmap LUNs. """
        if lunctx["mapped_lun"] in lunctx["acl"].mapped_luns.all():
            lunctx["acl"].mapped_luns.remove(lunctx["mapped_lun"])

    def delete_acls(self, lunctx):
        """ Delete the ACL named in the context. """
        lunctx["acl"].delete()

    def delete_luns(self, lunctx):
        """ If there are no ACLs left, delete the LUN named in the context. """
        if lunctx["lun"].acl_set.count() == 0:
            lunctx["lun"].delete()

    def delete_targets(self, lunctx):
        """ If there are no LUNs left, delete the TPG. Same goes for the target. """
        if lunctx["tpg"].lun_set.count() == 0:
            lunctx["tpg"].delete()
        if lunctx["target"].tpg_set.count() == 0:
            lunctx["target"].delete()

class IscsiHandler(ProtocolHandler):
    module = "iscsi"

    def get_targets(self):
        """ Yield the target to be used for the volume. """
        tgts = Target.objects.filter(host=Host.objects.get_current(), type=self.module, name=self.hostacl.volume.storageobj.name).distinct()
        if len(tgts) > 1:
            raise Target.MultipleObjectsReturned("Found multiple Targets for the volume")
        elif len(tgts) == 1:
            yield {"target": tgts[0], "module": self.module}
        else:
            tgt = Target(host=Host.objects.get_current(), type="iscsi", name=self.hostacl.volume.storageobj.name)
            tgt.full_clean()
            tgt.save()
            yield ctxupdate(target=tgt, module=self.module)

    def get_tpgs(self, targetctx):
        """ Yield the TPG to be used for the HostACL.

            iSCSI uses a TPG for each HostACL, so create one if there is none and yield it.
        """
        try:
            tpg = TPG.objects.get(target=targetctx["target"])
        except TPG.DoesNotExist:
            try:
                tag = max( v["tag"] for v in TPG.objects.filter(target=targetctx["target"]).values("tag") ) + 1
            except ValueError:
                tag = 1
            tpg = TPG(target=targetctx["target"], tag=tag)
            tpg.full_clean()
            tpg.save()
        yield ctxupdate(targetctx, tpg=tpg)

    def get_portals(self, tpgctx):
        """ Make sure the Portal is included in the ACL and yield it. """
        for want_portal in self.hostacl.portals.all():
            if want_portal not in tpgctx["tpg"].portals.all():
                tpgctx["tpg"].portals.add(want_portal)
            yield ctxupdate(tpgctx, portal=want_portal)

class FcHandler(ProtocolHandler):
    module = "qla2xxx"

    def get_targets(self):
        """ Yield all targets for this host (volume doesn't matter). """
        for tgt in Target.objects.filter(host=Host.objects.get_current(), type=self.module):
            yield ctxupdate(target=tgt, module=self.module)

    def get_tpgs(self, targetctx):
        """ Get the target's TPG and yield it. """
        try:
            tpg = TPG.objects.get(target=targetctx["target"], tag=1)
        except TPG.DoesNotExist:
            tpg = TPG(target=targetctx["target"], tag=1)
            tpg.full_clean()
            tpg.save()
        yield ctxupdate(targetctx, tpg=tpg)

    def get_portals(self, tpgctx):
        """ FC doesn't use portals, so this doesn't yield anything. """
        return []

    def delete_targets(self, lunctx):
        """ Deleting FC targets is not a good idea. """
        pass


class HostACL(models.Model):
    """ Grant a Host access to a Volume via the given Portals (if applicable). """
    host        = models.ForeignKey(Host)
    volume      = models.ForeignKey(BlockVolume)
    portals     = models.ManyToManyField(Portal)
    lun_id      = models.IntegerField()

    objects     = getHostDependentManagerClass("volume__volume__host")()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install:
            pre_install.send(sender=HostACL, instance=self)
            ProtocolHandler.install_hostacl(self)
            get_dbus_object("/lio").saveconfig()
            post_install.send(sender=HostACL, instance=self)

    def __unicode__(self):
        return "%s -> %s" % (self.volume, self.host)

def __hostacl_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=HostACL, instance=instance)
    ProtocolHandler.uninstall_hostacl(instance)
    get_dbus_object("/lio").saveconfig()
    post_uninstall.send(sender=HostACL, instance=instance)

models.signals.pre_delete.connect(__hostacl_pre_delete, sender=HostACL)

def __hostacl_portals_changed(instance, reverse, action, pk_set, **kwargs):
    if not reverse:
        hostacls = [instance]
    else:
        hostacls = TPG.objects.filter(id__in=pk_set)
    for hostacl in hostacls:
        ProtocolHandler.install_hostacl(hostacl)
    get_dbus_object("/lio").saveconfig()

models.signals.m2m_changed.connect(__hostacl_portals_changed, sender=HostACL.portals.through)
