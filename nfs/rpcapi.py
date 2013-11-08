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

from ifconfig.models import Host
from nfs.models import Export

class NfsExportHandler(ModelHandler):
    model = Export

class NfsExportProxy(ProxyModelHandler, NfsExportHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volume.pool.volumepool.host == Host.objects.get_current():
            return None
        return model.volume.pool.volumepool.host.peerhost_set.all()[0]



RPCD_HANDLERS = [NfsExportProxy]
