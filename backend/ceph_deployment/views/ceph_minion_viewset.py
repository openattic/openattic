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
import logging

from django_filters import FilterSet
from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework import status

from ceph_deployment.models.ceph_minion import CephMinion
from nodb.restapi import NodbSerializer, NodbViewSet
from rest.utilities import get_request_data, CommaSeparatedValueFilter
from utilities import aggregate_dict

logger = logging.getLogger(__name__)

class CephMinionSerializer(NodbSerializer):

    class Meta(object):
        model = CephMinion


class CephMinionFilter(FilterSet):

    hostname_in = CommaSeparatedValueFilter(name='hostname', lookup_type='in')

    class Meta:
        model = CephMinion
        fields = ("hostname",)


class CephMinionViewSet(NodbViewSet):
    """
    Ceph Minions
    """

    serializer_class = CephMinionSerializer
    filter_class = CephMinionFilter
    search_fields = ("hostname",)
    lookup_value_regex = r'[^/]+'

    def get_queryset(self):
        return CephMinion.objects.all()

    def _do_scrub(self, request, object_list):
        deep_scrub = get_request_data(request).get('deep-scrub', False)
        if not object_list:
            logger.info('scrub triggered without minions')
        results = []
        for minion in object_list:
            results.append(minion.scrub(deep_scrub=deep_scrub))

        res = {
            'command': "deep-scrub" if deep_scrub else "scrub",
            'result': aggregate_dict(*results)
        }
        return Response(res, status=status.HTTP_200_OK)

    @detail_route(['post'])
    def scrub(self, request, *args, **kwargs):
        return self._do_scrub(request, [self.get_object()])

    @list_route(['post', 'get'])  # DRF 3: make use of url_path='scrub'
    def scrub_many(self, request, *args, **kwargs):
        return self._do_scrub(request, self.filter_queryset(self.get_queryset()))






