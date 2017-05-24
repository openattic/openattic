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

from ceph_radosgw.conf import settings
from awsauth import S3Auth
import requests


def has_static_credentials():
    return all(STATIC_CREDENTIALS.values())


STATIC_CREDENTIALS = {
    'host': settings.RGW_API_HOST,
    'port': settings.RGW_API_PORT,
    'access_key': settings.RGW_API_ACCESS_KEY,
    'secret_key': settings.RGW_API_SECRET_KEY,
    'scheme': settings.RGW_API_SCHEME,
}


def has_salt_api_credentials():
    return all((settings.SALT_API_HOST, settings.SALT_API_PORT, settings.SALT_API_USERNAME,
                settings.SALT_API_PASSWORD, settings.SALT_API_EAUTH))


def get_rgw_api_response(request, path, credentials):
    # Fall back to user configuration if value for port or scheme isn't provided by DeepSea.
    credentials['port'] = credentials['port'] or settings.RGW_API_PORT
    credentials['scheme'] = credentials['scheme'] or settings.RGW_API_SCHEME

    params = request.GET.copy()
    s3auth = S3Auth(credentials['access_key'],
                    credentials['secret_key'],
                    service_url='{}:{}'.format(credentials['host'], credentials['port']))
    url = '{}://{}:{}/{}'.format(credentials['scheme'], credentials['host'], credentials['port'],
                                 settings.RGW_API_ADMIN_RESOURCE + '/' + path)
    response = requests.request(request.method, url, data=request.body, params=params, auth=s3auth)
    return response.content, response.status_code
