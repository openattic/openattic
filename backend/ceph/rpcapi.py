# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

from rpcd.handlers import ModelHandler, mkModelHandler
from volumes.rpcapi import AbstractVolumePoolHandler, AbstractBlockVolumeHandler

from ceph import models

class ClusterHandler(ModelHandler):
    model = models.Cluster

    def _override_get(self, obj, data):
        data["status"] = obj.status
        return data

class PoolHandler(AbstractVolumePoolHandler):
    model = models.Pool

class ImageHandler(AbstractBlockVolumeHandler):
    model = models.Image

RPCD_HANDLERS = [
    ClusterHandler,
    PoolHandler,
    ImageHandler,
    mkModelHandler(models.OSD),
    mkModelHandler(models.Mon),
    mkModelHandler(models.MDS),
    mkModelHandler(models.Entity),
    ]
