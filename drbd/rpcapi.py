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

from drbd.models import DrbdDevice

class DrbdDeviceHandler(ModelHandler):
    model = DrbdDevice

    def _override_get(self, obj, data):
        data['path']    = obj.path
        data['basedev'] = obj.basedev
        if obj.initialized:
            data['cstate']  = obj.cstate
            data['dstate']  = obj.dstate
            data['role']    = obj.role
        else:
            data['cstate'] = data['dstate'] = data['role'] = "unconfigured"
        return data

    def primary(self, id):
        """ Switch the DRBD resource given by `id` to the Primary role on this host. """
        dev = DrbdDevice.objects.get(id=id)
        return dev.primary()

RPCD_HANDLERS = [DrbdDeviceHandler]
