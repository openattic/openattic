# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import sysutils.models
from drbd.models import DeviceMinor

def create_devminors(**kwargs):
    existing_minors = [dm["minor"] for dm in DeviceMinor.objects.all().values("minor")]
    for i in range(10, 256):
        if i not in existing_minors:
            DeviceMinor.objects.create(minor=i, connection=None)
    DeviceMinor.objects.filter(minor__gte=256).delete()

sysutils.models.post_install.connect(create_devminors)
