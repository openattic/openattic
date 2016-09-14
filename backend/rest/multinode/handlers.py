# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from collections import OrderedDict

from django.conf import settings

from rest_framework.response import Response
from rest_framework.request import Request

from ifconfig.models import Host

from utilities import get_related_model, drf_version


class RequestHandlers(object):

    def retrieve(self, request, view_name=None, *args, **kwargs):
        obj = self.get_object()
        host = self._get_object_host(obj)
        current_host = Host.objects.get_current()

        if host == current_host:
            if view_name:
                local_view = getattr(super(RequestHandlers, self), view_name)
                return local_view(request, args, kwargs)

            return super(RequestHandlers, self).retrieve(request, args, kwargs)
        return self._remote_request(request, host, obj=obj, view_name=view_name)

    def list(self, request, *args, **kwargs):
        queryset_total = self.get_queryset()
        unpaginated_queryset = self.filter_queryset(queryset_total)
        if drf_version() < (3, 0):
            queryset = self.paginate_queryset(unpaginated_queryset)
        else:
            queryset = self.paginator.paginate_queryset(unpaginated_queryset, request, self)
        assert queryset is not None

        current_host = Host.objects.get_current()

        results = []
        for obj in queryset:
            host = self._get_object_host(obj)
            if host == current_host:
                serializer = self.get_serializer(obj)
                results.append(serializer.data)
            else:
                response = self._remote_request(request, host, obj=obj)
                results.append(response.data)

        if drf_version() >= (3, 0):
            return self.paginator.get_paginated_response(results)

        next_page = None
        prev_page = None

        ip = current_host.get_primary_ip_address().host_part

        if queryset.has_next():
            next_page = '%s?ordering=%s&page=%s&pageSize=%s' % \
                        (self._get_base_url(ip, self.api_prefix),
                         request.QUERY_PARAMS['ordering'],
                         queryset.next_page_number(),
                         request.QUERY_PARAMS['pageSize'])
        if queryset.has_previous():
            prev_page = '%s?ordering=%s&page=%s&pageSize=%s' % \
                        (self._get_base_url(ip, self.api_prefix),
                         request.QUERY_PARAMS['ordering'],
                         queryset.previous_page_number(),
                         request.QUERY_PARAMS['pageSize'])

        return Response(OrderedDict([
            ('count',       queryset.paginator.count),
            ('next',        next_page),
            ('previous',    prev_page),
            ('results',     results)
        ]))

    def create(self, request, *args, **kwargs):
        host = self._get_reqdata_host(request.DATA)

        if host == Host.objects.get_current():
            return super(RequestHandlers, self).create(request, args, kwargs)

        return self._remote_request(request, host)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        host = self._get_object_host(obj)

        if host == Host.objects.get_current():
            return super(RequestHandlers, self).destroy(request, args, kwargs)

        return self._remote_request(request, host, obj=obj)

    def update(self, request, *args, **kwargs):
        obj = self.get_object_or_none()

        if obj is None:
            return self.create(request, args, kwargs)

        host = self._get_object_host(obj)
        if host == Host.objects.get_current():
            return super(RequestHandlers, self).update(request, args, kwargs)

        return self._remote_request(request, host, obj=obj)

    def _remote_request(self, request, host, *args, **kwargs):
        ip = host.get_primary_ip_address().host_part
        api_prefix = kwargs.get("api_prefix", self.api_prefix)

        if "obj" in kwargs and kwargs["obj"]:
            obj = kwargs["obj"]
            url = '%s/%s' % (self._get_base_url(ip, api_prefix), str(obj.id))
        else:
            url = self._get_base_url(ip, api_prefix)

        if "view_name" in kwargs and kwargs["view_name"]:
            url = '%s/%s' % (url, kwargs["view_name"])

        header = self._get_auth_header(request)
        header['content-type'] = 'application/json'

        current_host = Host.objects.get_current()
        data = dict(request.DATA, proxy_host_id=current_host.id)

        response = requests.request(request.method, url, data=json.dumps(data), headers=header)

        try:
            response_data = response.json()
        except ValueError:
            # For example in case of DELETE requests the response might contain no data
            response_data = ""

        return Response(response_data, status=response.status_code)

    def _get_base_url(self, ip, api_prefix):
        api_root = getattr(settings, "API_ROOT")
        return 'http://%s%s/%s' % (ip, api_root, api_prefix)

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
        try:
            return self.get_host_by_data(data)
        except:
            host_filter = self.host_filter.split('__')

            try:
                return self.model.objects.get(id=data[host_filter[0]]['id']).host
            except:
                target_model = get_related_model(
                    self.model._meta.get_field_by_name(host_filter[0])[0])

                if target_model == Host:
                    return Host.objects.get(id=data[host_filter[0]]['id'])
                else:
                    try:
                        host = target_model.all_objects.get(id=data[host_filter[0]]['id'])
                    except target_model.DoesNotExist:
                        key = host_filter.pop(0)

                        target_model = get_related_model(
                            target_model._meta.get_field_by_name(host_filter[0])[0])
                        host = target_model.all_objects.get(id=data[key]['id'])

                    for field in host_filter[1:]:
                        host = getattr(host, field)
                        if isinstance(host, Host):
                            return host

    def _get_auth_header(self, request):
        auth_token = request.user.auth_token.key
        return {'Authorization': 'Token %s' % auth_token}

    def _clone_request_with_new_data(self, request, data):
        clone = Request(request=request._request,
                        parsers=request.parsers,
                        authenticators=request.authenticators,
                        negotiator=request.negotiator,
                        parser_context=request.parser_context)
        clone._data = data
        clone._files = request._files
        clone._content_type = request._content_type
        clone._stream = request._stream
        clone._method = request._method
        if hasattr(request, '_user'):
            clone._user = request._user
        if hasattr(request, '_auth'):
            clone._auth = request._auth
        if hasattr(request, '_authenticator'):
            clone._authenticator = request._authenticator

        return clone
