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
            data['state']  = obj.state
            data['graphs'] = obj.perfdata

            qryset = Graph.objects.filter( command=obj.command )
            if qryset.count():
                data["graphs"] = [ { "id": gr.id, "title": gr.title } for gr in qryset ]
            else:
                perfd = obj.perfdata
                data["graphs"] = []
                for i in range(len(perfd)): # someone please shoot me
                    data["graphs"].append( { "id": i, "title": perfd[i][0] } )

        except KeyError:
            data["state"]  = None
            data["graphs"] = None

        return data


RPCD_HANDLERS = [CommandHandler, ServiceHandler, GraphHandler]
