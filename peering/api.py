# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from piston.handler import BaseHandler
from peering.models import PeerHost

class PeerHostHandler(BaseHandler):
    allowed_methods = ('GET',)
    model   = PeerHost
    fields  = ("id", "name", "username", "base_url")

    @staticmethod
    def resource_uri():
        return ('api_peering_host_handler', ['id'])

api_handlers = [
    ( (r'peering/hosts/(?P<id>\w+)/', r'peering/hosts/'), PeerHostHandler, 'api_peering_host_handler' ),
    ]
