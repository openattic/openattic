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
from rpcd.handlers import ProxyModelHandler

from lvm.models    import VolumeGroup
from twraid.models import Controller, Enclosure, Unit, Disk

class ControllerHandler(ModelHandler):
    model = Controller

class EnclosureHandler(ModelHandler):
    model = Enclosure

class UnitHandler(ModelHandler):
    model = Unit

    def _override_get(self, obj, data):
        data["disk_set"] = []
        handler = self._get_handler_instance(Disk)
        for disk in obj.disk_set.all():
            data["disk_set"].append( handler._idobj(disk) )
        return data

    def find_by_vg(self, id):
        vg = VolumeGroup.objects.get(id=id)
        return [self._getobj(unit) for unit in Unit.objects.find_by_vg(vg)]

class UnitProxy(ProxyModelHandler, UnitHandler):
    def find_by_vg(self, id):
        handler = self._get_handler_instance(VolumeGroup)
        targethost = handler._find_target_host(id)
        if targethost is None:
            return self.backing_handler.find_by_vg(id)
        else:
            return self._get_proxy_object(targethost).find_by_vg(id)

class DiskHandler(ModelHandler):
    model = Disk

    def set_identify(self, id, state):
        """ Turn the identification LED on or off. """
        disk = Disk.objects.get(id=id)
        return disk.set_identify(state)

class DiskProxy(ProxyModelHandler, DiskHandler):
    def set_identify(self, id, state):
        """ Turn the identification LED on or off. """
        return self._call_singlepeer_method("set_identify", id, state)




RPCD_HANDLERS = [ControllerHandler, EnclosureHandler, UnitProxy, DiskProxy]
