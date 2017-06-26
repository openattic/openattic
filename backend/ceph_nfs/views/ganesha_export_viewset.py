# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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

from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from rest_framework.decorators import list_route
from rest_framework.response import Response

from ceph_nfs.models import GaneshaExport
from ceph_nfs.tasks import async_deploy_exports, async_stop_exports
from ceph.restapi import FsidContext
from deepsea import DeepSea
from nodb.restapi import NodbSerializer, NodbViewSet

logger = logging.getLogger(__name__)


class GaneshaExportSerializer(NodbSerializer):
    class Meta(object):
        model = GaneshaExport


class GaneshaExportViewSet(NodbViewSet):
    serializer_class = GaneshaExportSerializer
    search_fields = ('host', 'path', 'pseudo', 'tag')
    lookup_fields = ('host', 'exportId')

    def __init__(self, **kwargs):
        super(GaneshaExportViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph_nfs'))

    def get_queryset(self):
        return GaneshaExport.objects.all()

    def get_object(self, queryset=None):
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        lfilter = {}
        for field in self.lookup_fields:
            if self.kwargs[field]:
                lfilter[field] = self.kwargs[field]
        return get_object_or_404(queryset, **lfilter)

    @list_route(methods=['post'])
    def bulk_delete(self, request, *args, **kwargs):
        exports = GaneshaExport.objects.all()
        hosts = set([e.host for e in exports])

        if 'exportIds' not in request.DATA or not isinstance(request.DATA['exportIds'], list):
            logger.error("JSON input is not an array")
            raise ValidationError("JSON input is not an array")

        exports_to_delete = [eid.strip() for eid in request.DATA['exportIds']]
        logger.info("Deleting exports: %s", exports_to_delete)
        new_exports = [e for e in exports if e.id not in exports_to_delete]
        if len(new_exports) == len(exports):
            logger.info("No Ganesha export deleted")
            return Response()

        status = DeepSea.instance().nfs_status_exports()
        empty_hosts = hosts-(set(e.host for e in new_exports))
        GaneshaExport.save_exports(new_exports, empty_hosts)
        for host in empty_hosts:
            if status[host]['active']:
                async_stop_exports.delay(host)
        for host in set(e.host for e in new_exports):
            if status[host]['active']:
                async_deploy_exports.delay(host)

        return Response()
