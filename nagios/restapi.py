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

from rest_framework import serializers, viewsets
from rest_framework.reverse import reverse

from nagios.models import Service, Graph
from rest import relations


class ServiceSerializer(serializers.HyperlinkedModelSerializer):
    graphs  = serializers.SerializerMethodField('get_graphs')
    last_check  = serializers.DateTimeField(read_only=True)
    next_check  = serializers.DateTimeField(read_only=True)
    status      = serializers.CharField(read_only=True)
    plugin_output = serializers.CharField(source="state.plugin_output", read_only=True)
    perfdata      = serializers.SerializerMethodField('get_performance_data')
    host          = relations.HyperlinkedRelatedField(view_name='host-detail', many=False, read_only=False)

    class Meta:
        model  = Service
        fields = ('url', 'id', 'host', 'description', 'graphs', 'last_check', 'next_check', 'status', 'plugin_output', 'perfdata')

    def get_graphs(self, obj):
        graphs = []
        for graph in Graph.objects.filter( command=obj.command ):
            graphs.append({
                "id":    graph.id,
                "title": graph.title,
                "url":   reverse("nagios.views.graph", args=(obj.id, graph.id), request=self.context["request"])
            })
        for (srcid, title) in obj.rrd.source_labels.items():
            graphs.append({
                "id":    srcid,
                "title": title,
                "url":   reverse("nagios.views.graph", args=(obj.id, srcid), request=self.context["request"])
            })
        return graphs

    def get_performance_data(self, obj):
        return obj.perfdata

class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_fields = ('host__name', 'description')
    search_fields = ('host__name', 'description')

RESTAPI_VIEWSETS = [
    ('services', ServiceViewSet),
]

