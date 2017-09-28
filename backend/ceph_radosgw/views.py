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
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view
from ceph_radosgw.rgw_client import RGWClient
from ceph_nfs.models import GaneshaExport
from rest_client import RequestException


class NoCredentialsResponse(HttpResponse):
    def __init__(self):
        content = json.dumps({
            'Code': 'ConfigurationIncomplete',
            'Message': 'Rados Gateway seems to be either unconfigured or misconfigured. '
                       'Please check your configuration or contact your system administrator.'
        })
        super(NoCredentialsResponse, self).__init__(content,
                                                    content_type='application/json',
                                                    status=500)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def proxy_view(request, path):

    try:
        result = RGWClient.admin_instance().proxy(request.method, path, request.GET.copy(),
                                                  request.body)
        return HttpResponse(result, status=200)
    except RequestException as e:
        if not e.status_code:
            raise Exception(str(e))
        return HttpResponse(e.content, status=e.status_code)
    except RGWClient.NoCredentialsException:
        return NoCredentialsResponse()


@api_view(['PUT'])
def bucket_create(request):

    try:
        params = request.GET.copy()

        if 'bucket' not in params:
            raise ValidationError('No bucket parameter provided')
        if 'uid' not in params:
            raise ValidationError('No uid parameter provided')

        result = RGWClient.instance(params['uid']).create_bucket(params['bucket'])
        return HttpResponse(result, status=200)
    except RequestException as e:
        if not e.status_code:
            raise Exception(str(e))
        return HttpResponse(e.content, status=e.status_code)
    except RGWClient.NoCredentialsException:
        return NoCredentialsResponse()

@api_view(['GET'])
def bucket_is_referenced(request):

    try:
        params = request.GET.copy()

        if 'bucket' not in params:
            raise ValidationError('No bucket parameter provided')

        buckets = params.getlist('bucket')

        # Prepare result object.
        result = dict.fromkeys(buckets, False)

        # Get the buckets that are referenced by NFS Ganesha.
        exports = GaneshaExport.objects.filter(path__in=buckets)
        for export in exports:
            result[export.path] = True

        return HttpResponse(json.dumps(result), status=200)
    except RequestException as e:
        if not e.status_code:
            raise Exception(str(e))
        return HttpResponse(e.content, status=e.status_code)
    except RGWClient.NoCredentialsException:
        return NoCredentialsResponse()
