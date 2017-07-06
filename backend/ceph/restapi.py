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
from django.utils.functional import cached_property
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import detail_route, list_route

from ceph.models import *

from nodb.restapi import NodbSerializer, NodbViewSet
from taskqueue.restapi import TaskQueueLocationMixin
from rest.restapi import NoCacheModelViewSet

from rest.utilities import get_request_query_filter_data, get_request_data, mk_method_field_params, \
    drf_version


class CrushmapVersionSerializer(serializers.ModelSerializer):
    crushmap = serializers.SerializerMethodField("get_crush_map")

    class Meta:
        model = CrushmapVersion

    def get_crush_map(self, obj):
        return obj.get_tree()


class CephClusterSerializer(NodbSerializer):

    class Meta:
        model = CephCluster

class CephClusterViewSet(NodbViewSet):
    """
    Ceph Cluster

    This is the root of a Ceph Cluster. More details are available at ```/api/ceph/<fsid>/pools```,
    ```/api/ceph/<fsid>/osds```, ```/api/ceph/<fsid>/status```,
    ```/api/ceph/<fsid>/crushmap```,
    ```/api/ceph/<fsid>/performancedata``` and ```/api/ceph/<fsid>/performancedata_pools```.
    """

    serializer_class = CephClusterSerializer
    filter_fields = ("name",)

    def get_queryset(self):
        return CephCluster.objects.all()

    @detail_route(methods=['get'])
    def status(self, request, *args, **kwargs):
        object = self.get_object()
        return Response(object.status, status=status.HTTP_200_OK)

    @detail_route(methods=['get'])
    def performancedata(self, request, *args, **kwargs):
        fsid = kwargs['pk']
        filter_data = get_request_query_filter_data(request, "filter")
        performance_data = CephCluster.get_performance_data(fsid, filter_data)
        return Response(performance_data, status=status.HTTP_200_OK)

    @detail_route(methods=["get"])
    def performancedata_pools(self, request, *args, **kwargs):
        fsid = kwargs['pk']

        filter_data = dict()
        for filter_key in ["filter_pools", "filter_sources"]:
            filter_data[filter_key] = get_request_query_filter_data(request, filter_key)

        performance_data = CephPool.get_performance_data(fsid, filter_data)
        return Response(performance_data, status=status.HTTP_200_OK)

    @detail_route(methods=['get'])
    def crushmap(self, request, *args, **kwargs):
        data = CrushmapVersionSerializer(self.get_object().get_crushmap(), many=False, read_only=True).data
        return Response(data, status=status.HTTP_200_OK)


class CephPoolSerializer(NodbSerializer):

    class Meta:
        model = CephPool

    erasure_code_profile = \
        serializers.PrimaryKeyRelatedField(default=None, required=False,
                                           queryset=CephErasureCodeProfile.objects.all())
    quota_max_objects = serializers.IntegerField(default=0)
    quota_max_bytes = serializers.IntegerField(default=0)
#    crush_ruleset = serializers.IntegerField() # TODO OP-1415
    size = serializers.IntegerField(default=None, required=False)
    min_size = serializers.IntegerField(default=None, required=False)
    crash_replay_interval = serializers.IntegerField(default=0)
    cache_mode = serializers.CharField(default='none')
    if drf_version() >= (3, 0):
        # DRF 3 requires `allow_null=True` and DRF 2 cannot cope with `allow_null`
        tier_of = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                     allow_null=True,
                                                     queryset=CephPool.objects.all())
        write_tier = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                        allow_null=True,
                                                        queryset=CephPool.objects.all())
        read_tier = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                       allow_null=True,
                                                       queryset=CephPool.objects.all())
    else:
        tier_of = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                     queryset=CephPool.objects.all())
        write_tier = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                        queryset=CephPool.objects.all())
        read_tier = serializers.PrimaryKeyRelatedField(default=None, required=False,
                                                       queryset=CephPool.objects.all())

    target_max_bytes = serializers.IntegerField(default=0)
    hit_set_period = serializers.IntegerField(default=0)
    hit_set_count = serializers.IntegerField(default=0)

    def validate(self, data):
        errors = {}
        if 'type' in data:
            if data['type'] == 'replicated':
                errors = {
                    field: ['Replicated pools need ' + field]
                    for field
                    in ['size', 'min_size']
                    if field not in data or data[field] is None
                }
            else:
                errors = {
                    field: ['Erasure coded pools need ' + field]
                    for field
                    in ['erasure_code_profile']
                    if field not in data or data[field] is None
                }
        if errors:
            raise serializers.ValidationError(errors)
        return data


class FsidContext(object):

    def __init__(self, viewset=None, module_name=None, request=None):
        self.viewset = viewset
        self.request = request
        self.module_name = module_name

    @cached_property
    def fsid(self):
        request = self.viewset.request if self.viewset else self.request
        import re
        m = re.match(r'^.*/api/{}/(?P<fsid>[a-zA-Z0-9-]+)/.*'.format(self.module_name),
                     request.path)
        return m.groupdict()["fsid"]

    @cached_property
    def cluster(self):
        return get_object_or_404(CephCluster, fsid=self.fsid)


class CephPoolViewSet(TaskQueueLocationMixin, NodbViewSet):
    """Represents a Ceph pool.

    Due to the fact that we need a Ceph cluster fsid, we can't provide the ViewSet directly with
    a queryset. It needs a context which isn't available when this position is evaluated.

    .. warning:: Calling DELETE will *PERMANENTLY DESTROY* all data stored in this pool.
    """

    serializer_class = CephPoolSerializer
    filter_fields = ("name", "type",)
    search_fields = ("name",)

    def __init__(self, **kwargs):
        super(CephPoolViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephPool.objects.all()

    @detail_route(methods=['get', 'post', 'delete'])
    def snapshots(self, request, *args, **kwargs):
        """
        If you are wondering, why you don't get an error, if a snapshot already exists:
        http://tracker.ceph.com/projects/ceph/repository/revisions/43d62c00c99f1cd311d44b0b0c272e6d67685256/diff/src/m
           on/OSDMonitor.cc

        :type request: Request
        """
        pool = CephPool.objects.get(pk=kwargs['pk'])
        if request.method == 'GET':
            return Response(pool.pool_snaps, status=status.HTTP_200_OK)
        elif request.method == 'POST':
            pool.create_snapshot(get_request_data(request)['name'])
            return Response(CephPool.objects.get(pk=kwargs['pk']).pool_snaps,
                            status=status.HTTP_201_CREATED)
        elif request.method == 'DELETE':
            pool.delete_snapshot(get_request_data(request)['name'])
            return Response(CephPool.objects.get(pk=kwargs['pk']).pool_snaps,
                            status=status.HTTP_200_OK)
        else:
            raise ValueError('{}. Method not allowed.'.format(request.method))


class CephErasureCodeProfileSerializer(NodbSerializer):

    class Meta:
        model = CephErasureCodeProfile


class CephErasureCodeProfileViewSet(NodbViewSet):
    """Represents a Ceph erasure-code-profile."""

    serializer_class = CephErasureCodeProfileSerializer
    lookup_field = "name"
    filter_fields = ("name",)
    search_fields = ("name",)

    def __init__(self, **kwargs):
        super(CephErasureCodeProfileViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephErasureCodeProfile.objects.all()


class CephOsdSerializer(NodbSerializer):

    class Meta(object):
        model = CephOsd


class CephOsdViewSet(NodbViewSet):
    """Represents a Ceph osd.

    The reply consists of the output of ```osd tree```.
    """
    filter_fields = ("name", "id")
    serializer_class = CephOsdSerializer

    def __init__(self, **kwargs):
        super(CephOsdViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephOsd.objects.all()

    @list_route()
    def balance_histogram(self, request, *args, **kwargs):
        """Generates a NVD3.js compatible json for displaying the osd balance histogram of a
        cluster."""
        values = [{'label': osd.name, 'value': osd.utilization}
                  for osd in CephOsd.objects.all().order_by('utilization')]

        json_data = [
            {
                'key': 'OSD utilization histogram',
                'values': values
            }
        ]

        return Response(json_data, status=status.HTTP_200_OK)


class CephPgSerializer(NodbSerializer):

    lookup_field = "pgid"

    class Meta(object):
        model = CephPg


class CephPgViewSet(NodbViewSet):
    """Represents a Ceph Placement Group.

    Typical filter arguments are `?osd_id=0` or `?pool_name=cephfs_data`. Filtering can improve the
    backend performance
    considerably.

    """
    filter_fields = ("osd_id", "pool_name", "pgid")
    serializer_class = CephPgSerializer
    lookup_field = "pgid"
    lookup_value_regex = r'[^/]+'

    def __init__(self, **kwargs):
        super(CephPgViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephPg.objects.all()


class CephRbdSerializer(NodbSerializer):

    class Meta(object):
        model = CephRbd


class CephRbdViewSet(NodbViewSet):
    """Represents a Ceph RADOS block device aka RBD."""

    filter_fields = ("name",)
    serializer_class = CephRbdSerializer
    lookup_value_regex = r'[^/@]+/[^/]+'
    search_fields = ('name', 'pool__name')

    def __init__(self, **kwargs):
        super(CephRbdViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephRbd.objects.all()

    @detail_route(methods=["get"])
    def performancedata_rbd(self, request, *args, **kwargs):
        rbd = self.get_object()
        filter_data = get_request_query_filter_data(request, "filter")
        performance_data = CephRbd.get_performance_data(rbd, filter_data)
        return Response(performance_data, status=status.HTTP_200_OK)


class CephFsSerializer(NodbSerializer):

    class Meta(object):
        model = CephFs


class CephFsViewSet(NodbViewSet):
    """
    Ceph filesystem (CephFS)

    .. warning:: Calling DELETE will *PERMANENTLY DESTROY* all data stored in this fs.
    """

    serializer_class = CephFsSerializer

    def __init__(self, **kwargs):
        super(CephFsViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph'))

    def get_queryset(self):
        return CephFs.objects.all()


RESTAPI_VIEWSETS = [
]
