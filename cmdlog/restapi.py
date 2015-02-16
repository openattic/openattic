
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
from rest_framework_bulk.generics import BulkDestroyAPIView

from rest import relations

from cmdlog import models


class LogEntrySerializer(serializers.HyperlinkedModelSerializer):
    host = relations.HyperlinkedRelatedField(view_name='host-detail', read_only=True)

    class Meta:
        model = models.LogEntry
        fields = ('url', 'id', 'host', 'command', 'user', 'starttime', 'endtime', 'exitcode', 'text')


class LogEntryViewSet(viewsets.ModelViewSet, BulkDestroyAPIView):
    queryset = models.LogEntry.objects.all()
    serializer_class = LogEntrySerializer
    search_fields = ('command', 'text')

    def filter_queryset(self, queryset):
        if self.request.method == 'DELETE':
            filtered_items = []

            for key, value in self.request.QUERY_PARAMS.items():
                filtered_items.append(queryset.get(id=value))

            return filtered_items

        return queryset


RESTAPI_VIEWSETS = [
    ('cmdlogs', LogEntryViewSet)
]