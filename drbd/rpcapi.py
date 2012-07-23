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

from drbd.models import Connection, Endpoint

class DrbdConnectionHandler(ModelHandler):
    model = Connection

    def _override_get(self, obj, data):
        hnd = self._get_handler_instance(Endpoint)
        data['local_endpoint'] = None
        if obj.endpoints_running_here or (obj.stacked and obj.local_lower_connection.is_primary):
            data['cstate'] = obj.cstate
            data['dstate'] = obj.dstate
            data['role']   = obj.role
            if obj.endpoints_running_here:
                data['local_endpoint'] = hnd._getobj(obj.local_endpoint)
        else:
            data['cstate'] = data['dstate'] = data['role'] = "unconfigured"
        return data


class DrbdEndpointHandler(ModelHandler):
    model = Endpoint

    def _override_get(self, obj, data):
        data['path']    = obj.path
        data['basedev'] = obj.basedev
        return data

    def primary(self, id):
        """ Switch the DRBD resource given by `id` to the Primary role on this host. """
        dev = Endpoint.objects.get(id=id)
        return dev.primary()


RPCD_HANDLERS = [DrbdConnectionHandler, DrbdEndpointHandler]
