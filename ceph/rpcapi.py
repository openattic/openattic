# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2013, it-novum GmbH <community@open-attic.org>
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

from ceph import models

RPCD_HANDLERS = [
    mkModelHandler(models.Cluster),
    mkModelHandler(models.Type),
    mkModelHandler(models.Bucket),
    mkModelHandler(models.OSD),
    mkModelHandler(models.Mon),
    mkModelHandler(models.MDS),
    mkModelHandler(models.Pool),
    mkModelHandler(models.Entity),
    ]
