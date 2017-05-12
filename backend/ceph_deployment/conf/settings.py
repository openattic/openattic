# -*- coding: utf-8 -*-
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

SALT_API_HOST = getattr(settings, 'SALT_API_HOST', 'salt')
SALT_API_PORT = getattr(settings, 'SALT_API_PORT', 8000)
SALT_API_USERNAME = getattr(settings, 'SALT_API_USERNAME', 'admin')
SALT_API_PASSWORD = getattr(settings, 'SALT_API_PASSWORD', 'admin')
SALT_API_EAUTH = getattr(settings, 'SALT_API_EAUTH', 'auto')
