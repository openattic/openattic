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

import django_filters

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from rest import relations

from ceph.models import Cluster, CrushmapVersion


class CrushmapVersionSerializer(serializers.ModelSerializer):
    crushmap    = serializers.SerializerMethodField("get_crush_map")

    class Meta:
        model = CrushmapVersion

    def get_crush_map(self, obj):
        return obj.get_tree()

class ClusterSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Ceph Cluster. """
    url         = serializers.HyperlinkedIdentityField(view_name="cephcluster-detail")
    crushmap    = serializers.SerializerMethodField("get_crushmap")

    class Meta:
        model = Cluster
        fields = ('url', 'id', 'name', 'crushmap',
                  'auth_cluster_required', 'auth_client_required', 'auth_service_required')

    def get_crushmap(self, obj):
        return CrushmapVersionSerializer(obj.get_crushmap(), many=False, read_only=True).data

class ClusterViewSet(viewsets.ModelViewSet):
    queryset         = Cluster.objects.all()
    serializer_class = ClusterSerializer
    filter_fields    = ('name',)
    search_fields    = ('name',)

    def update(self, request, *args, **kwargs):
        cluster = self.get_object()

        if "crushmap" in request.DATA:
            cluster.set_crushmap(request.DATA["crushmap"])

        cluster_ser = ClusterSerializer(cluster, many=False, context={"request": request})
        return Response(cluster_ser.data)


RESTAPI_VIEWSETS = [
    ('cephclusters', ClusterViewSet, 'cephcluster')
]
