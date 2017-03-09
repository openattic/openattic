# kate: space-indent on; indent-width 4; replace-tabs on;

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

import socket
import django_filters

from rest_framework import serializers
from rest_framework.decorators import list_route
from rest_framework.response import Response

from rest import relations
from rest.utilities import DeleteCreateMixin, NoCacheModelViewSet

from volumes.models import StorageObject
from samba.models import Share
from samba.conf import settings as samba_settings

from rest.multinode.handlers import RequestHandlers


class SambaShareSerializer(DeleteCreateMixin, serializers.HyperlinkedModelSerializer):
    """ Serializer for a Samba Share. """
    url = serializers.HyperlinkedIdentityField(view_name="sambashare-detail")
    volume = relations.HyperlinkedRelatedField(view_name="volume-detail",
                                               source="volume.storageobj",
                                               queryset=StorageObject.objects.all())

    class Meta:
        model = Share
        fields = ('url', 'id', 'name', 'path', 'available', 'browseable', 'guest_ok', 'writeable',
                  'comment', 'volume')

    def update_validated_data(self, attrs):
        if "volume.storageobj" in attrs:
            attrs["volume"] = attrs["volume.storageobj"].filesystemvolume_or_none
            del attrs["volume.storageobj"]
        else:
            attrs["volume"] = attrs["volume"]["storageobj"].filesystemvolume_or_none
        return attrs


class SambaShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model = Share
        fields = ['volume']


class SambaShareViewSet(NoCacheModelViewSet):
    queryset = Share.objects.all()
    serializer_class = SambaShareSerializer
    filter_class = SambaShareFilter

    @list_route()
    def domainconfig(self, request):
        return Response({
            'hostname':  socket.gethostname(),
            'fqdn':      socket.getfqdn(),
            'domain':    samba_settings.DOMAIN,
            'workgroup': samba_settings.WORKGROUP,
        })


class SambaShareProxyViewSet(RequestHandlers, SambaShareViewSet):
    queryset = Share.all_objects.all()
    api_prefix = 'sambashares'
    host_filter = 'volume__storageobj__host'
    model = Share

    @list_route()
    def domainconfig(self, request, *args, **kwargs):
        return self.list(request, 'domainconfig', *args, **kwargs)


RESTAPI_VIEWSETS = [
    ('sambashares', SambaShareProxyViewSet, 'sambashare')
]
