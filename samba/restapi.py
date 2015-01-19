
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

from samba.models import Share

class SambaShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Samba Share. """
    url         = serializers.HyperlinkedIdentityField(view_name="sambashare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True, source="volume.storageobj")

    class Meta:
        model = Share
        fields = ('url', 'id', 'name', 'path', 'available', 'browseable', 'guest_ok', 'writeable', 'comment', 'volume')

class SambaShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Share
        fields = ['volume']

class SambaShareViewSet(viewsets.ModelViewSet):
    queryset         = Share.objects.all()
    serializer_class = SambaShareSerializer
    filter_class     = SambaShareFilter

    def create(self, request, *args, **kwargs):
        print request.items()
        print "create Samba share"
        return Response(True)


RESTAPI_VIEWSETS = [
    ('sambashares', SambaShareViewSet, 'sambashare')
]
