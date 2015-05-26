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
from rest_framework.response import Response

from rest import relations

from ceph.models import Cluster


class ClusterSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Ceph Cluster. """
    url         = serializers.HyperlinkedIdentityField(view_name="cephcluster-detail")
    crush_map   = serializers.SerializerMethodField("get_crush_map")
    bucket_types= serializers.SerializerMethodField("get_bucket_types")
    rulesets    = serializers.SerializerMethodField("get_rulesets")
    #rulesets    = RulesetSerializer(many=True, read_only=True, source="ruleset_set")

    class Meta:
        model = Cluster
        fields = ('url', 'id', 'name', 'crush_map', 'bucket_types', 'rulesets',
                  'auth_cluster_required', 'auth_client_required', 'auth_service_required')

    def get_crush_map(self, obj):
        def serialize_bucket(obj):
            return {
                "name":     obj.name,
                "ceph_id":  obj.ceph_id,
                "alg":      obj.alg,
                "type":     obj.type.name,
                "children": [ serialize_bucket(child) for child in obj.children.all() ]
            }

        return []
        return [ serialize_bucket(rootbkt) for rootbkt in
                 obj.bucket_set.filter(parent__isnull=True) ]

    def get_bucket_types(self, obj):
        return []
        return [ {"id": bucket_type.ceph_id, "name": bucket_type.name}
                 for bucket_type in obj.type_set.all() ]

    def get_rulesets(self, obj):
        return []

class ClusterViewSet(viewsets.ModelViewSet):
    queryset         = Cluster.objects.all()
    serializer_class = ClusterSerializer
    filter_fields    = ('name',)
    search_fields    = ('name',)


RESTAPI_VIEWSETS = [
    ('cephclusters', ClusterViewSet, 'cephcluster')
]
