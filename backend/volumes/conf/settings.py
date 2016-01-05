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

from django.conf import settings

VOLUME_INITD     = getattr( settings, "LVM_VOLUME_INITD",   '/etc/openattic/volume_init.d')
MOUNT_PREFIX     = getattr( settings, "LVM_MOUNT_PREFIX",   "/media"       )
CHOWN_GROUP      = getattr( settings, "LVM_CHOWN_GROUP",    "users" )
