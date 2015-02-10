
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

from volumes.models import StorageObject
from http.models import Export

class HttpShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a HTTP Export. """
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
        volume = StorageObject.objects.get(id=request.DATA["volume"])
        del request.DATA["volume"]
        instance = Export(volume = volume.filesystemvolume_or_none)
        serializer = self.get_serializer(instance=instance, data=request.DATA, files=request.FILES)

        if serializer.is_valid():
            self.pre_save(serializer.object)
            self.object = serializer.save(force_insert=True)
            self.post_save(self.object, created=True)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED,
                            headers=headers)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


RESTAPI_VIEWSETS = [
    ('httpshares', HttpShareViewSet, 'httpshare')
]
