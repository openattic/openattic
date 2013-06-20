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

from rtslib.root   import RTSRoot
from rtslib        import target
from rtslib.tcm    import IBlockBackstore, FileIOBackstore

from systemd       import invoke, logged, LockingPlugin, method

from lio           import models


@logged
class SystemD(LockingPlugin):
    dbus_path = "/lio"

    @method(in_signature="i", out_signature="")
    def backstore_create(self, id):
        mdl_bs = models.Backstore.objects.get(id=id)
        if bdl_bs.type == "iblock":
            lio_bs = target.IBlockBackstore(0)
        else:
            lio_bs = target.FileIOBackstore(0)
        storage = None
        for sobj in lio_bs.storage_objects:
            if sobj.name == mdl_bs.volume.name:
                storage = sobj
                break
        if storage is None:
            storage = lio_bs.storage_object(mdl_bs.volume.name, mdl_bs.volume.path)
        mdl_bs.wwn = storage.wwn
        mdl_bs.save()

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
    def tpg_create(self, id):
        mdl_tpg = models.TPG.objects.get(id=id)
        lio_tgt = mdl_tpg.target.lio_object
        lio_tpg = target.TPG(lio_tgt, mdl_tpg.tag)
        tpg.set_attribute("authentication",             str(int(mdl_tpg.chapauth)))
        tpg.set_attribute("generate_node_acls",         "0")
        tpg.set_attribute("demo_mode_write_protect",    "0")
        tpg.set_parameter("InitialR2T",                 "No")
        tpg.enable = True

    @method(in_signature="i", out_signature="")
    def lun_create(self, id):
        mdl_lun = models.LUN.objects.get(id=id)
        lio_tpg = mdl_lun.tpg.lio_object
        tpg.lun(mdl_lun.lun_id, mdl_lun.storageobj.lio_object, "%s at %s" % (self.storageobj.volume.name, Host.objects.get_current().name))

    @method(in_signature="i", out_signature="")
    def portal_create(self, id, tpg_id):
        mdl_ptl = models.Portal.objects.get(id=id)
        mdl_tpg = models.TPG.objects.get(id=tpg_id)
        lio_tpg = mdl_tpg.lio_object
        lio_tpg.portal(mdl_ptl.ipaddress.host_part, mdl_ptl.port)
