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
from rpcd.handlers import ProxyModelHandler, proxy_for

from drbd.models import Connection, Endpoint

class DrbdConnectionHandler(ModelHandler):
    model = Connection

    def _get_model_manager(self):
        relevantids = [ conn.id for conn in Connection.objects.all()
                        if conn.endpoints_running_here or conn.stacked ]
        return self.model.objects.filter(id__in=relevantids)

    def _override_get(self, obj, data):
        hnd = self._get_handler_instance(Endpoint)
        data["endpoint_set"] = {}
        for endpoint in obj.endpoint_set.all():
            peerhost = endpoint.volume.vg.host
            data["endpoint_set"][peerhost.name] = hnd._getobj(endpoint)
        data["stack_child_set"] = []
        for lowerconn in obj.stack_child_set.all():
            conn = self._idobj(lowerconn)
            conn["endpoint_hosts"] = [ endpoint.volume.vg.host.name
                for endpoint in lowerconn.endpoint_set.all()]
            data["stack_child_set"].append(conn)

        if obj.endpoints_running_here or (obj.stacked and obj.local_lower_connection.is_primary):
            data['cstate'] = obj.cstate
            data['dstate'] = obj.dstate
            data['role']   = obj.role
        else:
            data['cstate'] = data['dstate'] = data['role'] = "unconfigured"
        return data

    def primary(self, id):
        """ Switch the DRBD connection given by `id` to the Primary role on this host. """
        conn = Connection.objects.get(id=id)
        return conn.primary()

    def secondary(self, id):
        """ Switch the DRBD connection given by `id` to the Secondary role on this host. """
        conn = Connection.objects.get(id=id)
        return conn.secondary()


class DrbdEndpointHandler(ModelHandler):
    model = Endpoint

    def _override_get(self, obj, data):
        data['path']    = obj.path
        data['basedev'] = obj.basedev
        return data

@proxy_for(DrbdConnectionHandler)
class DrbdConnectionProxy(ProxyModelHandler):
    model = Connection

    def _merge(self, objects):
        ret = {}
        for conn in objects:
            if conn["id"] not in ret:
                ret[conn["id"]] = conn
            elif conn["cstate"] != "Connected":
                # Let's see if we can learn anything new
                for host in ret[conn["id"]]["role"]:
                    if ret[conn["id"]]["role"][host] == "Unknown":
                        ret[conn["id"]]["role"][host] = conn["role"][host]
                for host in ret[conn["id"]]["dstate"]:
                    if ret[conn["id"]]["dstate"][host] == "DUnknown":
                        ret[conn["id"]]["dstate"][host] = conn["dstate"][host]
        return ret.values()

    def all(self):
        return self._merge( ProxyModelHandler.all(self) )

    def filter(self, kwds):
        return self._merge( ProxyModelHandler.filter(self, kwds) )

    def get(self, id):
        if not isinstance(id, dict):
            id = {"id": id}
        return self._merge( ProxyModelHandler.filter(self, id) )[0]

    def primary(self, id):
        """ Switch the DRBD connection given by `id` to the Primary role on this host. """
        self.backing_handler(self.user, self.request).primary(id)

    def secondary(self, id):
        """ Switch the DRBD connection given by `id` to the Secondary role on this host. """
        self.backing_handler(self.user, self.request).secondary(id)

    def promote(self, id, hostname):
        """ Promote the host given by `hostname` to primary. """
        from ifconfig.models import Host
        from peering.models import PeerHost
        if hostname == Host.objects.get_current().name:
            return self.backing_handler(self.user, self.request).primary(id)
        else:
            peerhost = PeerHost.objects.get(name=hostname)
            return peerhost.drbd.Connection.primary(id)

    def demote(self, id, hostname):
        """ Demote the host given by `hostname` to secondary. """
        from ifconfig.models import Host
        from peering.models import PeerHost
        if hostname == Host.objects.get_current().name:
            return self.backing_handler(self.user, self.request).secondary(id)
        else:
            peerhost = PeerHost.objects.get(name=hostname)
            return peerhost.drbd.Connection.secondary(id)


@proxy_for(DrbdEndpointHandler)
class DrbdEndpointProxy(ProxyModelHandler):
    model = Endpoint


RPCD_HANDLERS = [DrbdConnectionProxy, DrbdEndpointHandler]
