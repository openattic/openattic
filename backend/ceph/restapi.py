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
from rest_framework.response import Response
from rest_framework.pagination import PaginationSerializer
from rest_framework.decorators import detail_route

from ceph.models import Cluster, CrushmapVersion, CephCluster, CephPool, CephOsd
from ceph.models import CephPoolTier

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

    This is the root of a Ceph Cluster. More details are available at ```/api/ceph/<fsid>/pools```
    and ```/api/ceph/<fsid>/osds```.
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


class CephPoolTierSerializer(NodbSerializer):

    class Meta:
        model = CephPoolTier


class CephPoolSerializer(NodbSerializer):

    tiers = CephPoolTierSerializer(many=True)

    class Meta:
        model = CephPool


class FsidMixin:

    @cached_property
    def fsid(self):
        import re
        m = re.match(r'^.*/api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/.*', self.request.path)
        return m.groupdict()["fsid"]


class CephPoolViewSet(NodbViewSet, FsidMixin):
    """Represents a Ceph pool.

    Due to the fact that we need a Ceph cluster fsid, we can't provide the ViewSet directly with
    a queryset. It needs a context which isn't available when this position is evaluated.
    """

    serializer_class = CephPoolSerializer
    filter_fields = ("name",)
    search_fields = ("name",)

    def get_queryset(self):
        cluster = CephCluster.objects.all().get(fsid=self.fsid)
        return CephPool.objects.all({'cluster': cluster})


class PaginatedCephPoolSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephPoolSerializer


class PaginatedCephClusterSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephClusterSerializer


class CephOsdSerializer(NodbSerializer):

    class Meta(object):
        model = CephOsd


class CephOsdViewSet(NodbViewSet, FsidMixin):
    """Represents a Ceph osd.

    The reply consists of the output of ```osd tree```.
    """
    filter_fields = ("name", "id")
    serializer_class = CephOsdSerializer

    def get_queryset(self):
        cluster = CephCluster.objects.all().get(fsid=self.fsid)
        return CephOsd.objects.all({'cluster': cluster})


class PaginatedCephOsdSerializer(PaginationSerializer):

    class Meta(object):
        object_serializer_class = CephOsdSerializer

RESTAPI_VIEWSETS = [
    ('cephclusters', ClusterViewSet, 'cephcluster'),  # Old implementation, used by the CRUSH map
]
