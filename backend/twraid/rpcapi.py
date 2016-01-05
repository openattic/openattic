# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from twraid.models import Controller, Enclosure, Unit, Disk
from volumes.rpcapi import AbstractBlockVolumeHandler

class ControllerHandler(ModelHandler):
    model = Controller

class EnclosureHandler(ModelHandler):
    model = Enclosure

class UnitHandler(AbstractBlockVolumeHandler):
    model = Unit

    def _override_get(self, obj, data):
        handler = self._get_handler_instance(Disk)
        data["disk_set"] = [
            handler._idobj(disk) for disk in obj.disk_set.all()
            ]
        return data

    def get_raid_params(self, id):
        return Unit.objects.get(id=id).raid_params

class UnitProxy(ProxyModelHandler, UnitHandler):
    def get_raid_params(self, id):
        return self._call_singlepeer_method("get_raid_params", id)

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
