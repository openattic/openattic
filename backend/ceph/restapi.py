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

from rest_framework import serializers, viewsets
from rest_framework.response import Response

from ceph.models import Cluster, CrushmapVersion, CliModel, CephClusterCliModel


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


class CliSerializer(serializers.ModelSerializer):

    class Meta:
        model = CliModel


class CliCephClusterSerializer(CliSerializer):

    class Meta:
        model = CephClusterCliModel
        fields = ('fsid', 'name')


class CliViewSet(viewsets.ModelViewSet):
    serializer_class = CliSerializer


class CephClusterViewSet(CliViewSet):
    queryset = CephClusterCliModel.all()
    serializer_class = CliCephClusterSerializer

#     def list(self, request, *args, **kwargs):
#
#         # obj = CephClusterCliModel(**result)  # Normally done by the manager
#         queryset = self.get_queryset()
#         queryset = self.paginate_queryset(queryset)
#         print queryset.paginator.count
#         ser = CliCephClusterSerializer(queryset, context={"request": request}, many=True)
#         # ser = CliCephClusterSerializer(result[0], context={"request": request}, many=False)
#         return Response(ser.data)

    #def retrieve(self, request, *args, **kwargs):
    #     return Response({})

RESTAPI_VIEWSETS = [
    ('ceph', CephClusterViewSet, 'ceph'),
    ('cephclusters', ClusterViewSet, 'cephcluster')
]
