
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

from rest_framework import serializers, viewsets
from rest_framework.response import Response

from rest import relations

from http.models import Export

class HttpShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a NFS Export. """
    url         = serializers.HyperlinkedIdentityField(view_name="httpshare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True, source="volume.storageobj")

    class Meta:
        model = Export
        fields = ('url', 'id', 'path', 'volume')

class HttpShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Export
        fields = ['volume']

class HttpShareViewSet(viewsets.ModelViewSet):
    queryset         = Export.objects.all()
    serializer_class = HttpShareSerializer
    filter_class     = HttpShareFilter

    def create(self, request, *args, **kwargs):
        print request.items()
        print "create NFS share"
        return Response(True)


RESTAPI_VIEWSETS = [
    ('httpshares', HttpShareViewSet, 'httpshare')
]
