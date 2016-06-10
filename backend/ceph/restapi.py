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
from django.utils.functional import cached_property
from rest_framework import serializers, viewsets, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.pagination import PaginationSerializer
from rest_framework.decorators import detail_route

from ceph.models import *

from nodb.restapi import NodbSerializer, NodbViewSet


class CrushmapVersionSerializer(serializers.ModelSerializer):
    crushmap = serializers.SerializerMethodField("get_crush_map")

    class Meta:
        model = CrushmapVersion

    def get_crush_map(self, obj):
        return obj.get_tree()


class ClusterSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Ceph Cluster. """
    url = serializers.HyperlinkedIdentityField(view_name="cephcluster-detail")
    crushmap = serializers.SerializerMethodField("get_crushmap")

    class Meta:
        model = Cluster
        fields = ('url', 'id', 'name', 'crushmap',
                  'auth_cluster_required', 'auth_client_required', 'auth_service_required')

    def get_crushmap(self, obj):
        return CrushmapVersionSerializer(obj.get_crushmap(), many=False, read_only=True).data


class ClusterViewSet(viewsets.ModelViewSet):
    queryset = Cluster.objects.all()
    serializer_class = ClusterSerializer
    filter_fields = ('name',)
    search_fields = ('name',)

    def update(self, request, *args, **kwargs):
        cluster = self.get_object()

        if "crushmap" in request.DATA:
            cluster.set_crushmap(request.DATA["crushmap"])

        cluster_ser = ClusterSerializer(cluster, many=False, context={"request": request})

        return Response(cluster_ser.data)


class CephClusterSerializer(NodbSerializer):

    class Meta:
        model = CephCluster


class CephClusterViewSet(NodbViewSet):
    """
    Ceph Cluster

    This is the root of a Ceph Cluster. More details are available at ```/api/ceph/<fsid>/pools```,
    ```/api/ceph/<fsid>/osds``` and ```/api/ceph/<fsid>/status```.
    """

    serializer_class = CephClusterSerializer
    filter_fields = ("name",)

    def get_queryset(self):
        return CephCluster.objects.all()

    @detail_route(methods=['get'])
    def status(self, request, *args, **kwargs):
        fsid = kwargs['pk']
        cluster_status = CephCluster.get_status(fsid)
        return Response(cluster_status, status=status.HTTP_200_OK)


class CephPoolSerializer(NodbSerializer):

    class Meta:
        model = CephPool


class FsidContext(object):

    def __init__(self, viewset):
        self.viewset = viewset

    @cached_property
    def fsid(self):
        import re
        m = re.match(r'^.*/api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/.*', self.viewset.request.path)
        return m.groupdict()["fsid"]

    @cached_property
    def cluster(self):
        return CephCluster.objects.all().get(fsid=self.fsid)


class CephPoolViewSet(NodbViewSet):
    """Represents a Ceph pool.

    Due to the fact that we need a Ceph cluster fsid, we can't provide the ViewSet directly with
    a queryset. It needs a context which isn't available when this position is evaluated.

    .. warning:: Calling DELETE will *PERMANENTLY DESTROY* all data stored in this pool.
    """

    serializer_class = CephPoolSerializer
    filter_fields = ("name",)
    search_fields = ("name",)

    def __init__(self, **kwargs):
        super(CephPoolViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self))

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
            pool.create_snapshot(request.DATA['name'])
            return Response(CephPool.objects.get(pk=kwargs['pk']).pool_snaps, status=status.HTTP_201_CREATED)
        elif request.method == 'DELETE':
            pool.delete_snapshot(request.DATA['name'])
            return Response(CephPool.objects.get(pk=kwargs['pk']).pool_snaps, status=status.HTTP_200_OK)
        else:
            raise ValueError('{}. Method not allowed.'.format(request.method))


class PaginatedCephPoolSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephPoolSerializer


class PaginatedCephClusterSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephClusterSerializer


class CephErasureCodeProfileSerializer(NodbSerializer):

    class Meta:
        model = CephErasureCodeProfile


class CephErasureCodeProfileViewSet(NodbViewSet):
    """Represents a Ceph erasure-code-profile."""

    serializer_class = CephErasureCodeProfileSerializer
    lookup_field = "name"

    def __init__(self, **kwargs):
        super(CephErasureCodeProfileViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self))

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
        self.set_nodb_context(FsidContext(self))

    def get_queryset(self):
        return CephOsd.objects.all()


class PaginatedCephOsdSerializer(PaginationSerializer):

    class Meta(object):
        object_serializer_class = CephOsdSerializer


class CephPgSerializer(NodbSerializer):

    lookup_field = "pgid"

    class Meta(object):
        model = CephPg


class CephPgViewSet(NodbViewSet):
    """Represents a Ceph Placement Group.

    Typical filter arguments are `?osd_id=0` or `?pool_name=cephfs_data`. Filtering can improve the backend performance
    considerably.

    """
    filter_fields = ("osd_id", "pool_name", "pgid")
    serializer_class = CephPgSerializer
    lookup_field = "pgid"
    lookup_value_regex = r'[^/]+'

    def __init__(self, **kwargs):
        super(CephPgViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self))

    def get_queryset(self):
        return CephPg.objects.all()


class CephRbdSerializer(NodbSerializer):

    class Meta(object):
        model = CephRbd


class CephRbdViewSet(NodbViewSet):
    """Represents a Ceph RADOS block device aka RBD."""

    filter_fields = ("name",)
    serializer_class = CephRbdSerializer

    def __init__(self, **kwargs):
        super(CephRbdViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self))

    def get_queryset(self):
        return CephRbd.objects.all()


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
        self.set_nodb_context(FsidContext(self))

    def get_queryset(self):
        return CephFs.objects.all()


RESTAPI_VIEWSETS = [
    ('cephclusters', ClusterViewSet, 'cephcluster'),  # Old implementation, used by the CRUSH map
]
