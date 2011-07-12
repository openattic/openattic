# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from peering.models import PeerHost

class PeerHostHandler(BaseHandler):
    model  = PeerHost
    fields = ["id", "name"]

RPCD_HANDLERS = [PeerHostHandler]
