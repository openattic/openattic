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
from rpcd.handlers import ProxyModelHandler

from http.models import Export

class HttpExportHandler(ModelHandler):
    model = Export

    def _override_get(self, obj, data):
        data["url"] = "/volumes/%s" % obj.volume.name
        return data

class HttpExportProxy(ProxyModelHandler, HttpExportHandler):
    def get(self, id):
        ret = ProxyModelHandler.get(self, id)
        ret["url"] = "/openattic/http/" + str(ret["id"])
        return ret

    def all(self):
        ret = ProxyModelHandler.all(self)
        for obj in ret:
            obj["url"] = "/openattic/http/" + str(obj["id"])
        return ret

RPCD_HANDLERS = [HttpExportProxy]
