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
import json
from django.http import HttpResponse
from rest_framework.decorators import api_view
from ceph_radosgw.rgw_client import RGWClient
from rest_client import RequestException


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def proxy_view(request, path):

    try:
        result = RGWClient.admin_instance().proxy(request.method, path, request.GET.copy(),
                                                  request.body)
        return HttpResponse(result, 200)
    except RequestException as e:
        return HttpResponse(e.content, e.status_code)
    except RGWClient.NoCredentialsException:
        content = {
            'Code': 'ConfigurationIncomplete',
            'Message': 'Rados Gateway seems to be either unconfigured or misconfigured. '
                       'Please check your configuration or contact your system administrator.'
        }
        response = HttpResponse(json.dumps(content), status=500)
        response['Content-Type'] = 'application/json'
        return response
