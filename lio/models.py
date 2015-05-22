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
import rtslib
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

TARGET_TYPE_CHOICES = (
    ("iscsi",   "iscsi"),
    ("qla2xxx", "qla2xxx"),
)


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
        """ Yield the TPG to be used for the HostACL. """
        lio_tgt = targetctx["target"]
        for lio_tpg in lio_tgt.tpgs:
            # use the first one, if it exists.
            break
        else:
            lio_tpg = rtslib.TPG(lio_tgt, 1)
            if self.module == "iscsi":
                lio_tpg.set_attribute("authentication",      str(int(False)))
            lio_tpg.set_attribute("generate_node_acls",      "0")
            lio_tpg.set_attribute("demo_mode_write_protect", "0")
            lio_tpg.enable = True
        yield ctxupdate(targetctx, tpg=lio_tpg)

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
        volume_name = self.hostacl.volume.storageobj.name
        volume_path = self.hostacl.volume.volume.path
        volume_wwn  = self.hostacl.volume.storageobj.uuid
        lio_root = rtslib.RTSRoot()
        for lio_so in lio_root.storage_objects:
            if lio_so.wwn == volume_wwn:
                break
        else:
            try:
                # new no-Backstore layout
                lio_so = rtslib.BlockStorageObject(volume_name, volume_path, volume_wwn)
            except AttributeError:
                # Old Backstore+StorageObject system. create new backstore...
                max_idx = max([bs.index for bs in lio_root.backstores] + [0])
                lio_bs = rtslib.IBlockBackstore(max_idx + 1)
                lio_so = rtslib.IBlockStorageObject(lio_bs, volume_name, volume_path, gen_wwn=False)
                lio_so.wwn = volume_wwn

        lio_tpg = tpgctx["tpg"]
        for lio_lun in lio_tpg.luns:
            if realpath(lio_lun.storage_object.udev_path) == realpath(volume_path):
                break
        else:
            lio_lun = lio_tpg.lun(self.hostacl.lun_id, lio_so,
                "%s_at_%s" % (volume_name, Host.objects.get_current().name))

        yield ctxupdate(tpgctx, storageobj=lio_so, lun=lio_lun)

    def get_initiators(self, lunctx):
        """ Yield all initiators that are meant to have access to the LUN. """
        for initr in Initiator.objects.filter(host=self.hostacl.host, type=self.module):
            yield ctxupdate(lunctx, initiator=initr)

    def get_acls(self, initiatorctx):
        """ Yield an ACL object for the given initiator. """
        lio_tpg = initiatorctx["tpg"]
        initr_wwn = initiatorctx["initiator"].wwn
        for lio_acl in lio_tpg.node_acls:
            if lio_acl.node_wwn == initr_wwn:
                break
        else:
            lio_acl = lio_tpg.node_acl(initr_wwn)
        yield ctxupdate(initiatorctx, acl=lio_acl)

    def get_mapped_luns(self, aclctx):
        """ Make sure the LUN is mapped in the given ACL and yield it. """
        lio_lun = aclctx["lun"]
        lio_acl = aclctx["acl"]
        volume_wwn = self.hostacl.volume.storageobj.uuid
        for lio_mapped_lun in lio_acl.mapped_luns:
            if lio_mapped_lun.tpg_lun.storage_object.wwn == volume_wwn:
                break
        else:
            lio_mapped_lun = lio_acl.mapped_lun(self.hostacl.lun_id, lio_lun)
        yield ctxupdate(aclctx, mapped_lun=lio_mapped_lun)

    def delete(self, lunctx):
        self.delete_mapped_luns(lunctx)
        self.delete_acls(lunctx)
        self.delete_luns(lunctx)
        self.delete_targets(lunctx)

    def delete_mapped_luns(self, lunctx):
        """ Unmap LUNs. """
        for lio_mlun in lunctx["acl"].mapped_luns:
            if lio_mlun.tpg_lun.storage_object.wwn == lunctx["lun"].storage_object.wwn:
                lio_mlun.delete()

    def delete_acls(self, lunctx):
        """ Delete the ACL named in the context. """
        lunctx["acl"].delete()

    def delete_luns(self, lunctx):
        """ If there are no ACLs left, delete the LUN named in the context. """
        found = False
        storage_object = lunctx["lun"].storage_object
        for acl in lunctx["tpg"].node_acls:
            for mlun in acl.mapped_luns:
               if mlun.tpg_lun.storage_object.wwn == storage_object.wwn:
                   found = True
        if not found:
            lunctx["lun"].delete()
        # Check if we still need the StorageObject, and if not, get rid of it
        root = rtslib.RTSRoot()
        found = False
        for lio_tgt in root.targets:
            for lio_tpg in lio_tgt.tpgs:
                for lio_lun in lio_tpg.luns:
                    if lio_lun.storage_object.wwn == storage_object.wwn:
                        found = True
        if not found:
            storage_object.delete()

    def delete_targets(self, lunctx):
        """ If there are no LUNs left, delete the TPG. Same goes for the target. """
        if len(list(lunctx["tpg"].luns)) == 0:
            for lio_portal in lunctx["tpg"].network_portals:
                lio_portal.delete()
            lunctx["tpg"].delete()
        if len(list(lunctx["target"].tpgs)) == 0:
            lunctx["target"].delete()

class IscsiHandler(ProtocolHandler):
    module = "iscsi"

    def get_targets(self):
        """ Yield the target to be used for the volume. """
        fabric = rtslib.FabricModule(self.module)
        if not fabric.exists:
            raise SystemError("fabric %s not loaded" % self.module)

        # Generate IQN. the "prefix" part is shamelessly stolen from rtslib, but we use
        # the volume name instead of a random serial.
        localname = socket.gethostname().split(".")[0]
        localarch = os.uname()[4].replace("_", "")
        prefix = "iqn.2003-01.org.linux-iscsi.%s.%s" % (localname, localarch)
        prefix = prefix.strip().lower()
        volume_name = self.hostacl.volume.storageobj.name
        tgt_wwn = "%s:%s" % (prefix, volume_name.replace("_", "").replace(" ", ""))

        for lio_tgt in fabric.targets:
            if lio_tgt.wwn == tgt_wwn:
                break
        else:
            lio_tgt = rtslib.Target(fabric, tgt_wwn)

        yield ctxupdate(target=lio_tgt, fabric=fabric, module=self.module)

    def get_portals(self, tpgctx):
        """ Make sure the Portal is included in the ACL and yield it. """
        lio_tpg = tpgctx["tpg"]
        wanted_portals = self.hostacl.portals.all()
        if not wanted_portals:
            wanted_portals = Portal.objects.all()
        unseen_portals = list(lio_tpg.network_portals)
        for want_portal in wanted_portals:
            for lio_portal in lio_tpg.network_portals:
                if want_portal.ipaddress.host_part == lio_portal.ip_address and want_portal.port == lio_portal.port:
                    for unseen_portal in unseen_portals:
                        if unseen_portal.ip_address == lio_portal.ip_address and unseen_portal.port == lio_portal.port:
                            unseen_portals.remove(unseen_portal)
                    break
            else:
                lio_portal = lio_tpg.network_portal(want_portal.ipaddress.host_part, want_portal.port)
            yield ctxupdate(tpgctx, portal=lio_portal)
        print "unseen", unseen_portals
        for unseen_portal in unseen_portals:
            unseen_portal.delete()

class FcHandler(ProtocolHandler):
    module = "qla2xxx"

    def get_targets(self):
        """ Yield all targets for this host (volume doesn't matter). """
        fabric = rtslib.FabricModule(self.module)
        if not fabric.exists:
            raise SystemError("fabric %s not loaded" % self.module)

        for lio_tgt in fabric.targets:
            yield ctxupdate(target=lio_tgt, fabric=fabric, module=self.module)

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
            get_dbus_object("/lio").install_hostacl(self.id)
            get_dbus_object("/lio").saveconfig()
            post_install.send(sender=HostACL, instance=self)

    def __unicode__(self):
        return "%s -> %s" % (self.volume, self.host)

def __hostacl_pre_delete(instance, **kwargs):
    pre_uninstall.send(sender=HostACL, instance=instance)
    get_dbus_object("/lio").uninstall_hostacl(instance.id)
    get_dbus_object("/lio").saveconfig()
    post_uninstall.send(sender=HostACL, instance=instance)

models.signals.pre_delete.connect(__hostacl_pre_delete, sender=HostACL)

def __hostacl_portals_changed(instance, reverse, action, pk_set, **kwargs):
    if not reverse:
        hostacls = [instance]
    else:
        hostacls = HostACL.objects.filter(id__in=pk_set)
    for hostacl in hostacls:
        get_dbus_object("/lio").install_hostacl(hostacl.id)
    get_dbus_object("/lio").saveconfig()

models.signals.m2m_changed.connect(__hostacl_portals_changed, sender=HostACL.portals.through)
