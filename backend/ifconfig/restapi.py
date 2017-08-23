# -*- coding: utf-8 -*-

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

import django_filters

from rest_framework import serializers
from rest_framework.decorators import list_route
from rest_framework.response import Response

from ifconfig import models
from rest.utilities import mk_method_field_params
from rest.restapi import NoCacheModelViewSet


class HostSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='host-detail')
    installed_apps = serializers.SerializerMethodField(*mk_method_field_params('installed_apps'))
    oa_version = serializers.SerializerMethodField(*mk_method_field_params('oa_version'))

    class Meta:
        model = models.Host
        fields = ('id', 'name', 'url', 'installed_apps', 'oa_version')

    def get_installed_apps(self, obj):
        return obj.installed_apps

    def get_oa_version(self, obj):
        return obj.oa_version


def hostfilter_is_oa_host(queryset, is_oa_host):
    """
    The BooleanFilter coming with django-filter 0.7 does not support the features
    required to filter none-oA hosts because for those hosts the 'is_oa_host' field
    is not set to False. The BooleanFilter does not support the 'lookup_expr' and
    'exclude' arguments to filter such hosts.
    """
    result = []
    for entry in queryset:
        if bool(entry.is_oa_host) == bool(is_oa_host):
            result.append(entry)
    return result


class HostFilter(django_filters.FilterSet):
    is_oa_host = django_filters.BooleanFilter(action=hostfilter_is_oa_host)

    class Meta:
        model = models.Host
        fields = ['name']


class HostViewSet(NoCacheModelViewSet):
    queryset = models.Host.objects.all()
    serializer_class = HostSerializer
    filter_class = HostFilter
    search_fields = ('name',)

    @list_route()
    def current(self, request):
        serializer = HostSerializer(models.Host.objects.get_current(), context={"request": request})
        return Response(serializer.data)


RESTAPI_VIEWSETS = [
    ('hosts', HostViewSet, 'host'),
]
