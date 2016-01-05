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

from nagios.models import Command, Service, Graph

class CommandHandler(ModelHandler):
    model = Command

class GraphHandler(ModelHandler):
    model = Graph

class ServiceHandler(ModelHandler):
    model = Service
    order = ("description",)

    def _override_get(self, obj, data):
        try:
            data['state']  = obj.state
        except KeyError:
            data['state']  = None
            data["graphs"] = None
        else:
            qryset = Graph.objects.filter( command=obj.command )
            if qryset.count():
                data["graphs"] = [ { "id": gr.id, "title": gr.title } for gr in qryset ]
            else:
                try:
                    data["graphs"] = [ { "id": k, "title": v } for (k, v) in obj.rrd.source_labels.items() ]
                except SystemError:
                    data["graphs"] = None

        return data


RPCD_HANDLERS = [CommandHandler, ServiceHandler, GraphHandler]
