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

from peering.models import PeerHost
from ifconfig.models import Host
from nagios.models import Command, Service, Graph

class CommandHandler(ModelHandler):
    model = Command

class GraphHandler(ModelHandler):
    model = Graph

class ServiceHandler(ModelHandler):
    model = Service
    order = ("description",)

    def write_conf(self):
        """ Update the Nagios configuration and restart Nagios. """
        Service.write_conf()

    def _override_get(self, obj, data):
        try:
            data['state']  = obj.state
            data['graphs'] = obj.perfdata

            qryset = Graph.objects.filter( command=obj.command )
            if qryset.count():
                data["graphs"] = [ { "id": gr.id, "title": gr.title } for gr in qryset ]
            else:
                perfd = obj.perfdata
                data["graphs"] = []
                for i, graph in enumerate(perfd):
                    data["graphs"].append( { "id": i, "title": graph[0] } )

        except (KeyError, SystemError):
            data["state"]  = None
            data["graphs"] = None

        return data

@proxy_for(ServiceHandler)
class ServiceProxy(ProxyModelHandler):
    model = Service

    def _find_target_host(self, id):
        dbservice = Service.all_objects.get(id=int(id))
        if dbservice.volume is not None:
            host = dbservice.volume.vg.host
        else:
            host = dbservice.host
        if host == Host.objects.get_current():
            return None
        if host is None:
            raise RuntimeError("Object is not active on any host")
        return PeerHost.objects.get(name=host.name)


RPCD_HANDLERS = [CommandHandler, ServiceProxy, GraphHandler]
