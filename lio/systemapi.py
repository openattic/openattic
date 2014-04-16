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

from rtslib          import target
from tcm_dump        import tcm_full_backup

from ifconfig.models import Host
from systemd         import logged, LockingPlugin, method

from lio             import models


@logged
class SystemD(LockingPlugin):
    dbus_path = "/lio"

    @method(in_signature="i", out_signature="")
    def backstore_delete(self, id):
        models.Backstore.objects.get(id=id).lio_object.delete()

    @method(in_signature="i", out_signature="")
    def storage_object_create(self, id):
        mdl_so = models.StorageObject.objects.get(id=id)
        lio_bs = mdl_so.backstore.lio_object
        storage = lio_bs.storage_object(mdl_so.volume.storageobj.name, mdl_so.volume.volume.path, gen_wwn=False)
        storage.wwn = mdl_so.wwn

    @method(in_signature="i", out_signature="")
    def storage_object_delete(self, id):
        try:
            models.StorageObject.objects.get(id=id).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def target_create(self, id):
        mdl_tgt = models.Target.objects.get(id=id)
        fabric  = target.FabricModule(mdl_tgt.type)
        if not fabric.exists:
            for mod in fabric.load(): pass
        if not fabric.exists:
            raise SystemError("failed to load fabric module for '%s'" % mdl_tgt.type)
        lio_tgt = target.Target(fabric, mdl_tgt.wwn)

    @method(in_signature="i", out_signature="")
    def target_delete(self, id):
        try:
            models.Target.objects.get(id=id).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def tpg_create(self, id):
        mdl_tpg = models.TPG.objects.get(id=id)
        lio_tgt = mdl_tpg.target.lio_object
        lio_tpg = target.TPG(lio_tgt, mdl_tpg.tag)
        if mdl_tpg.target.type == "iscsi":
            lio_tpg.set_attribute("authentication",      str(int(mdl_tpg.chapauth)))
        lio_tpg.set_attribute("generate_node_acls",      "0")
        lio_tpg.set_attribute("demo_mode_write_protect", "0")
        #lio_tpg.set_parameter("InitialR2T",             "No") # → Invalid Argument <_<
        lio_tpg.enable = True

    @method(in_signature="i", out_signature="s")
    def tpg_getpath(self, id):
        """ Used for debugging purposes only, may be safely removed after #OA-51 has been fixed """
        mdl_tpg = models.TPG.objects.get(id=id)
        return mdl_tpg.lio_object.path

    @method(in_signature="i", out_signature="")
    def tpg_delete(self, id):
        try:
            models.TPG.objects.get(id=id).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def lun_create(self, id):
        mdl_lun = models.LUN.objects.get(id=id)
        lio_tpg = mdl_lun.tpg.lio_object
        lio_lun = lio_tpg.lun(mdl_lun.lun_id, mdl_lun.storageobj.lio_object,
                        "%s_at_%s" % (mdl_lun.storageobj.volume.storageobj.name, Host.objects.get_current().name))

    @method(in_signature="ii", out_signature="")
    def lun_map(self, id, acl_id):
        mdl_lun = models.LUN.objects.get(id=id)
        mdl_acl = mdl_lun.tpg.acl_set.get(id=acl_id)
        mdl_acl.lio_object.mapped_lun(mdl_lun.lun_id, mdl_lun.lio_object)

    @method(in_signature="ii", out_signature="")
    def lun_unmap(self, id, acl_id):
        mdl_lun = models.LUN.objects.get(id=id)
        mdl_acl = mdl_lun.tpg.acl_set.get(id=acl_id)
        for lio_mlun in mdl_acl.lio_object.mapped_luns:
            if lio_mlun.tpg_lun.storage_object.wwn == mdl_lun.storageobj.wwn:
                lio_mlun.delete()

    @method(in_signature="i", out_signature="")
    def lun_delete(self, id):
        try:
            models.LUN.objects.get(id=id).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="ii", out_signature="")
    def portal_create(self, id, tpg_id):
        mdl_ptl = models.Portal.objects.get(id=id)
        mdl_tpg = models.TPG.objects.get(id=tpg_id)
        lio_tpg = mdl_tpg.lio_object
        lio_tpg.network_portal(mdl_ptl.ipaddress.host_part, mdl_ptl.port)

    @method(in_signature="ii", out_signature="")
    def portal_delete(self, id, tpg_id):
        mdl_ptl = models.Portal.objects.get(id=id)
        mdl_tpg = models.TPG.objects.get(id=tpg_id)
        lio_tpg = mdl_tpg.lio_object
        for lio_ptl in lio_tpg.network_portals:
            if lio_ptl.ip_address == mdl_ptl.ipaddress.host_part and lio_ptl.port == mdl_ptl.port:
                lio_ptl.delete()

    @method(in_signature="i", out_signature="")
    def acl_create(self, id):
        mdl_acl = models.ACL.objects.get(id=id)
        lio_tpg = mdl_acl.tpg.lio_object
        lio_acl = lio_tpg.node_acl(mdl_acl.initiator.wwn)

    @method(in_signature="i", out_signature="")
    def acl_delete(self, id):
        try:
            models.ACL.objects.get(id=id).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="", out_signature="")
    def saveconfig(self):
        # ripped from /usr/share/pyshared/targetcli/ui_root.py (ui_command_saveconfig function)
        tcm_full_backup(None, None, '1', None)

