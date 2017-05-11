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
from deepsea import DeepSea

from ceph_radosgw import radosgw
from ceph_radosgw.conf import settings


def proxy_view(request, path):

    # Credentials have been given manually, they'll be preferably used.
    if radosgw.has_static_credentials():
        credentials = radosgw.STATIC_CREDENTIALS

    # Salt API credentials are given to be able to retrieve the RGW API credentials.
    elif radosgw.has_salt_api_credentials():
        credentials = DeepSea.instance().get_rgw_api_credentials()
        # As long as DeepSea doesn't provide port, we'll use DeepSea pre-defined default.
        credentials['port'] = settings.RGW_API_PORT

    else:
        content = {
            'Code': 'ConfigurationIncomplete',
            'Message': 'Rados Gateway seems to be either unconfigured or misconfigured. '
                       'Please check your configuration or contact your system administrator.'
        }
        response = HttpResponse(json.dumps(content), status=500)
        response['Content-Type'] = 'application/json'
        return response

    content, status_code = radosgw.get_rgw_api_response(request, path, credentials)
    return HttpResponse(content, status=status_code)
