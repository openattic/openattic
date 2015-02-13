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

import socket
import django_filters

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import list_route
from rest_framework.response import Response

from rest import relations

from volumes.models import StorageObject
from samba.models import Share
from samba.conf import settings as samba_settings

class SambaShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Samba Share. """
    url         = serializers.HyperlinkedIdentityField(view_name="sambashare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", source="volume.storageobj", queryset=StorageObject.objects.all())

    class Meta:
        model = Share
        fields = ('url', 'id', 'name', 'path', 'available', 'browseable', 'guest_ok', 'writeable', 'comment', 'volume')

    def restore_object(self, attrs, instance=None):
        attrs["volume"] = attrs["volume.storageobj"].filesystemvolume_or_none
        del attrs["volume.storageobj"]
        return super(SambaShareSerializer, self).restore_object(attrs, instance)

class SambaShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Share
        fields = ['volume']

class SambaShareViewSet(viewsets.ModelViewSet):
    queryset         = Share.objects.all()
    serializer_class = SambaShareSerializer
    filter_class     = SambaShareFilter

    @list_route()
    def domainconfig(self, request):
        return Response({
            'hostname':  socket.gethostname(),
            'homain':    samba_settings.DOMAIN,
            'workgroup': samba_settings.WORKGROUP,
        })

RESTAPI_VIEWSETS = [
    ('sambashares', SambaShareViewSet, 'sambashare')
]
