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
import requests
import json
from django.http import HttpResponse
from django.conf import settings
from awsauth import S3Auth

RGW_HOST = getattr(settings, 'RGW_HOST', '')
RGW_PORT = getattr(settings, 'RGW_PORT', '')
RGW_ACCESS_KEY = getattr(settings, 'RGW_ACCESS_KEY', '')
RGW_SECRET_KEY = getattr(settings, 'RGW_SECRET_KEY', '')
RGW_ADMIN_RESOURCE = getattr(settings, 'RGW_ADMIN_RESOURCE', 'admin')


def proxy_view(request, path, headers=None):
    if not all((RGW_HOST, RGW_PORT, RGW_ACCESS_KEY, RGW_SECRET_KEY)):
        content = {
            'Code': 'ConfigurationIncomplete',
            'Message': 'Rados Gateway seems to be either unconfigured or misconfigured. '
                       'Please check your configuration or contact your system administrator.'
        }
        response = HttpResponse(json.dumps(content), status=500)
        response['Content-Type'] = 'application/json'
        return response

    params = request.GET.copy()
    s3auth = S3Auth(RGW_ACCESS_KEY, RGW_SECRET_KEY, service_url='{}:{}'.format(RGW_HOST, RGW_PORT))
    url = 'http://{}:{}/{}'.format(RGW_HOST, RGW_PORT, RGW_ADMIN_RESOURCE + '/' + path)
    response = requests.request(request.method, url, data=request.body, params=params,
                                headers=headers, auth=s3auth)
    proxy_response = HttpResponse(response.content, status=response.status_code)

    return proxy_response
