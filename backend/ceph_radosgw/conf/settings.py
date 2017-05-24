# -*- coding: utf-8 -*-
"""
 *  Copyright (c) 2017 SUSE LLC
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

RGW_API_HOST = getattr(settings, 'RGW_API_HOST', '')
# Default port necessary as DeepSea doesn't provide one. Also, 80 is the default port of DeepSea.
RGW_API_PORT = getattr(settings, 'RGW_API_PORT', 80)
RGW_API_ACCESS_KEY = getattr(settings, 'RGW_API_ACCESS_KEY', '')
RGW_API_SECRET_KEY = getattr(settings, 'RGW_API_SECRET_KEY', '')
RGW_API_ADMIN_RESOURCE = getattr(settings, 'RGW_API_ADMIN_RESOURCE', 'admin')
RGW_API_SCHEME = getattr(settings, 'RGW_API_SCHEME', 'http')

SALT_API_HOST = getattr(settings, 'SALT_API_HOST', '')
SALT_API_PORT = getattr(settings, 'SALT_API_PORT', '')
SALT_API_USERNAME = getattr(settings, 'SALT_API_USERNAME', '')
SALT_API_PASSWORD = getattr(settings, 'SALT_API_PASSWORD', '')
SALT_API_EAUTH = getattr(settings, 'SALT_API_EAUTH', '')