# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from nagios.models import Command, Service, Graph

class CommandHandler(ModelHandler):
    model = Command

class GraphHandler(ModelHandler):
    model = Graph

class ServiceHandler(ModelHandler):
    model = Service
    order = ("description",)

    def write_conf(self):
        Services.write_conf()

    def _override_get(self, obj, data):
        try:
            data['state']    = obj.state
            data['perfdata'] = obj.perfdata
        except KeyError:
            data["state"]    = None
            data["perfdata"] = None
        return data


RPCD_HANDLERS = [CommandHandler, ServiceHandler, GraphHandler]
