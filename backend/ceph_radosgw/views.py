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
        instance = RGWClient.admin_instance()
        params = request.GET.copy()

        if request.method == 'PUT' and path == 'bucket' and params['bucket']:
            # Create the bucket if necessary.
            # Note, the URL /bucket with the request method PUT is used to link a bucket to
            # a specified user by default (http://docs.ceph.com/docs/master/radosgw/adminops/#id56).
            # There is no RGW Admin OPS API resource to create a new bucket, thus the bucket is
            # created for the specified admin user and linked to the specified user in a second
            # step. The request method and path is used to be close to the rest of the RGW Admin
            # OPS API, see user management.
            if not instance.bucket_exists_all(params['bucket']):
                result = instance.create_bucket(params['bucket'])
                # If no parameter 'uid' is specified, then exit here.
                if not params['uid']:
                    return HttpResponse(result, 200)
                # Link the bucket to the specified user.
                params['bucket-id'] = result['bucket_info']['bucket']['bucket_id']

        result = instance.proxy(request.method, path, params, request.body)
        return HttpResponse(result, status=200)
    except RequestException as e:
        return HttpResponse(e.content, status=e.status_code)
    except RGWClient.NoCredentialsException:
        content = {
            'Code': 'ConfigurationIncomplete',
            'Message': 'Rados Gateway seems to be either unconfigured or misconfigured. '
                       'Please check your configuration or contact your system administrator.'
        }
        response = HttpResponse(json.dumps(content), status=500)
        response['Content-Type'] = 'application/json'
        return response
