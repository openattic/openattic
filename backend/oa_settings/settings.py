# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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


# Salt API settings
SALT_API_HOST = ('salt', str)
SALT_API_PORT = (8000, int)
SALT_API_USERNAME = ('admin', str)
SALT_API_PASSWORD = ('admin', str)
SALT_API_EAUTH = ('sharedsecret', str)
SALT_API_SHARED_SECRET = ('', str)

# RGW settings
RGW_API_HOST = ('', str)
RGW_API_PORT = (80, int)
RGW_API_ACCESS_KEY = ('', str)
RGW_API_SECRET_KEY = ('', str)
RGW_API_ADMIN_RESOURCE = ('admin', str)
RGW_API_USER_ID = ('', str)
RGW_API_SCHEME = ('http', str)

# Grafana
GRAFANA_API_HOST = ('localhost', str)
GRAFANA_API_PORT = (3000, int)
GRAFANA_API_USERNAME = ('admin', str)
GRAFANA_API_PASSWORD = ('admin', str)
GRAFANA_API_SCHEME = ('http', str)
