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

from ceph.models import Cluster, CrushmapVersion, CephCluster, CephPool, CephOsd, CephPg
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


class CephPoolTierSerializer(NodbSerializer):

    class Meta:
        model = CephPoolTier


class CephPoolSerializer(NodbSerializer):

    tiers = CephPoolTierSerializer(many=True, read_only=True)

    class Meta:
        model = CephPool

    def create(self, validated_data):
        return CephPool.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.replicated = validated_data.get('replicated', instance.replicated)
        instance.type = validated_data.get('type', instance.type)
        instance.erasure_coded = validated_data.get('erasure_coded', instance.erasure_coded)
        instance.erasure_code_profile = validated_data.get('erasure_code_profile', instance.erasure_code_profile)
        instance.quota_max_objects = validated_data.get('quota_max_objects', instance.quota_max_objects)
        instance.quota_max_bytes = validated_data.get('quota_max_bytes', instance.quota_max_bytes)
        instance.pg_num = validated_data.get('pg_num', instance.pg_num)
        instance.pgp_num = validated_data.get('pgp_num', instance.pgp_num)
        instance.crush_ruleset = validated_data.get('crush_ruleset', instance.crush_ruleset)
        instance.hit_set_params = validated_data.get('hit_set_params', instance.hit_set_params)
        instance.save()
        return instance

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
    """

    serializer_class = CephPoolSerializer
    filter_fields = ("name",)
    search_fields = ("name",)

    def __init__(self, **kwargs):
        super(CephPoolViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self))

    def get_queryset(self):
        return CephPool.objects.all()


class PaginatedCephPoolSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephPoolSerializer


class PaginatedCephClusterSerializer(PaginationSerializer):

    class Meta:
        object_serializer_class = CephClusterSerializer


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


RESTAPI_VIEWSETS = [
    ('cephclusters', ClusterViewSet, 'cephcluster'),  # Old implementation, used by the CRUSH map
]
