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

from peering.models import PeerHost

class PeerHostHandler(ModelHandler):
    model  = PeerHost

    def _override_get(self, obj, data):
        if obj.base_url:
            data['base_url'] = unicode(obj.base_url)
        return data

    def ping(self, id):
        """ Test connectivity by calling the Peer's ping method. """
        obj = PeerHost.objects.get(id=id)
        return obj.ping()

RPCD_HANDLERS = [PeerHostHandler]
