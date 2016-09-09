
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

import django_filters

from rest_framework import serializers, viewsets
from rest_framework_bulk.generics import BulkDestroyAPIView

from rest import relations

from datetime import datetime

from cmdlog import models

from utilities import get_request_query_params


class LogEntrySerializer(serializers.HyperlinkedModelSerializer):
    host = relations.HyperlinkedRelatedField(view_name='host-detail', read_only=True)

    class Meta:
        model = models.LogEntry
        fields = ('url', 'id', 'host', 'command', 'user', 'starttime', 'endtime', 'exitcode', 'text')


class LogEntryFilter(django_filters.FilterSet):
    start_datetime  = django_filters.DateTimeFilter(name='starttime', lookup_type='gte')
    end_datetime    = django_filters.DateTimeFilter(name='endtime', lookup_type='lte')

    class Meta:
        model = models.LogEntry
        fields = ['exitcode', 'start_datetime', 'end_datetime']


class LogEntryViewSet(viewsets.ModelViewSet, BulkDestroyAPIView):
    queryset = models.LogEntry.objects.all()
    serializer_class = LogEntrySerializer
    search_fields = ('command', 'text')
    filter_class = LogEntryFilter

    def filter_queryset(self, queryset):
        if self.request.method == 'DELETE':
            filtered_items = []

            for key in ['ids', 'datetime']:
                for entry in get_request_query_params(self.request).getlist(key):
                    if key == 'ids':
                        filtered_items.append(queryset.get(id=entry))
                    if key == 'datetime':
                        entryDatetime = datetime.strptime(entry, '%Y-%m-%dT%H:%M:%S.%fZ')
                        filtered_items = models.LogEntry.objects.filter(endtime__lt=entryDatetime)
            return filtered_items

        return super(LogEntryViewSet, self).filter_queryset(queryset)


RESTAPI_VIEWSETS = [
    ('cmdlogs', LogEntryViewSet)
]