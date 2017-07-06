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

GRAFANA_API_HOST = getattr(settings, 'GRAFANA_API_HOST', 'localhost')
GRAFANA_API_PORT = getattr(settings, 'GRAFANA_API_PORT', 3000)
GRAFANA_API_USERNAME = getattr(settings, 'GRAFANA_API_USERNAME', 'admin')
GRAFANA_API_PASSWORD = getattr(settings, 'GRAFANA_API_PASSWORD', 'admin')
GRAFANA_API_SCHEME = getattr(settings, 'GRAFANA_API_SCHEME', 'http')

settings.DISABLE_CSRF_FOR_API_PATH.append('/api/grafana')
