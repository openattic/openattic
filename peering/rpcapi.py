# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from peering.models import PeerHost

class PeerHostHandler(ModelHandler):
    model  = PeerHost
    fields = ["id", "name"]

    def _override_get(self, obj, data):
        if obj.base_url:
            data['base_url'] = unicode(obj.base_url)
            data['hostname'] = obj.base_url.hostname
            data['port']     = obj.base_url.port
            data["duplex"]   = obj.duplex
        return data

    def ping(self, id):
        """ Test connectivity by calling the Peer's ping method. """
        obj = PeerHost.objects.get(id=id)
        return obj.ping()

RPCD_HANDLERS = [PeerHostHandler]
