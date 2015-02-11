
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
from tftp.models import Instance

class TftpShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a TFTP Instance. """
    url         = serializers.HyperlinkedIdentityField(view_name="tftpshare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", source="volume.storageobj", queryset=StorageObject.objects.all())

    class Meta:
        model = Instance
        fields = ('url', 'id', 'path', 'address', 'volume')

    def restore_object(self, attrs, instance=None):
        attrs["volume"] = attrs["volume.storageobj"].filesystemvolume_or_none
        del attrs["volume.storageobj"]
        return super(TftpShareSerializer, self).restore_object(attrs, instance)

class TftpShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Instance
        fields = ['volume']

class TftpShareViewSet(viewsets.ModelViewSet):
    queryset         = Instance.objects.all()
    serializer_class = TftpShareSerializer
    filter_class     = TftpShareFilter


RESTAPI_VIEWSETS = [
    ('tftpshares', TftpShareViewSet, 'tftpshare')
]
