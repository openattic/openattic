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

from rpcd.handlers import ModelHandler
from rpcd.handlers import ProxyModelBaseHandler, ProxyModelHandler, proxy_for

from iscsi.models import Target, Lun, Initiator
from lvm.models import LogicalVolume
from peering.models import PeerHost
from ifconfig.models import IPAddress

class IscsiTargetHandler(ModelHandler):
    model = Target

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

@proxy_for(IscsiTargetHandler)
class IscsiTargetProxy(ProxyModelBaseHandler):
    model = Target

    def _find_target_host(self, id):
        dbtarget = self.model.all_objects.get(id=id)
        volumes = Lun.all_objects.filter(target=dbtarget).values("volume").distinct()
        if not volumes:
            return None
        volid = volumes[0]["volume"]
        host = LogicalVolume.all_objects.get(id=volid).vg.host
        return PeerHost.objects.get(name=host.name)

    def _get_model_manager(self):
        return self.model.all_objects

    def set(self, id, data):
        dbtarget = self.model.all_objects.get(id=id)
        if Lun.all_objects.filter(target=dbtarget).count():
            return self._call_singlepeer_method("set", id, data)
        else:
            return ModelHandler.set(self, id, data)

class IscsiLunHandler(ModelHandler):
    model = Lun

@proxy_for(IscsiLunHandler)
class IscsiLunProxy(ProxyModelHandler):
    model = Lun


class IscsiInitiatorHandler(ModelHandler):
    model = Initiator

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

RPCD_HANDLERS = [IscsiTargetProxy, IscsiLunProxy, IscsiInitiatorHandler]
