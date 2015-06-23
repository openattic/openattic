# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import requests, json

from collections import OrderedDict

from rest_framework.response import Response

from ifconfig.models import Host

class RequestHandlers(object):

    def retrieve(self, request, view_name=None, *args, **kwargs):
        obj = self.get_object()
        current_host = Host.objects.get_current()

        if obj.host == current_host:
            if view_name:
                local_view = getattr(super(RequestHandlers, self), view_name)
                return local_view(request, args, kwargs)

            return super(RequestHandlers, self).retrieve(request, args, kwargs)

        return Response(json.loads(self._remote_request(request, obj, view_name)))

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        pools = self.filter_queryset(queryset)
        pools = self.paginate_queryset(pools)

        current_host = Host.objects.get_current()

        result_pools = []
        for obj in pools:
            if obj.host == current_host:
                serializer = self.get_serializer(obj)
                result_pools.append(serializer.data)
            else:
                result_pools.append(json.loads(self._remote_request(request, obj)))

        next_page = None
        prev_page = None

        ip = current_host.get_primary_ip_address().host_part

        if pools.has_next():
            next_page = '%s?ordering=%s&page=%s&page_size=%s' % (self._get_base_url(ip),
                                                                 request.QUERY_PARAMS['ordering'],
                                                                 pools.next_page_number(),
                                                                 request.QUERY_PARAMS['page_size'])
        if pools.has_previous():
            prev_page = '%s?ordering=%s&page=%s&page_size=%s' % (self._get_base_url(ip),
                                                                 request.QUERY_PARAMS['ordering'],
                                                                 pools.previous_page_number(),
                                                                 request.QUERY_PARAMS['page_size'])

        return Response(OrderedDict([
            ('count',       len(queryset)),
            ('next',        next_page),
            ('previous',    prev_page),
            ('results',     result_pools)
        ]))

    def create(self, request, *args, **kwargs):
        host = self._get_reqdata_host(request.DATA)

        if host == Host.objects.get_current():
            return super(RequestHandlers, self).create(request, args, kwargs)

        return Response(self._remote_request(request, None, None, host))

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()

        if obj.host == Host.objects.get_current():
            return super(RequestHandlers, self).destroy(request, args, kwargs)

        return Response(self._remote_request(request, obj))

    def update(self, request, *args, **kwargs):
        obj = self.get_object_or_none()

        if obj is None:
            return self.create(request, args, kwargs)

        if obj.host == Host.objects.get_current():
            return super(RequestHandlers, self).update(request, args, kwargs)

        return Response(self._remote_request(request, obj))

    def _remote_request(self, request, obj=None, view_name=None, host=None):
        if not host:
            host = self._get_object_host(obj)

        ip = host.get_primary_ip_address().host_part

        if obj:
            url = '%s/%s' % (self._get_base_url(ip), str(obj.id))
        else:
            url = self._get_base_url(ip)

        if view_name:
            url = '%s/%s' % (url, view_name)

        auth_header = self._get_auth_header(request)

        if request.method == 'POST' or request.method =='PUT':
            auth_header['content-type'] = 'application/json'
            response = requests.request(request.method, url, data=json.dumps(request.DATA), headers=auth_header)
        else:
            response = requests.request(request.method, url, headers=auth_header)

        response.raise_for_status()
        return response.text

    def _get_base_url(self, ip):
        return 'http://%s/openattic/api/%s' % (ip, self.api_prefix)

    def _get_object_host(self, obj):
        try:
            host_filter = self.get_queryset().model.objects.hostfilter
        except AttributeError:
            return obj.host
        else:
            host = obj
            for field in host_filter.split('__'):
                host = getattr(host, field)
                if isinstance(host, Host):
                    return host

    def _get_reqdata_host(self, data):
        host_filter = self.host_filter.split('__')

        target_model = self.model._meta.get_field_by_name(host_filter[0])[0].related.parent_model

        if target_model == Host:
            return Host.objects.get(id=data[host_filter[0]]['id'])
        else:
            host = target_model.all_objects.get(id=data[host_filter[0]]['id'])
            for field in host_filter[1:]:
                host = getattr(host, field)
                if isinstance(host, Host):
                    return host

    def _get_auth_header(self, request):
        auth_token = request.user.auth_token.key
        return {'Authorization': 'Token %s' % auth_token}
