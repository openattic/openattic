# -*- coding: utf-8 -*-
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

import django_filters

from rest_framework import serializers, viewsets, status

from rest import relations

from volumes.models import StorageObject
from nfs.models import Export

from rest.multinode.handlers import RequestHandlers

class NfsShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for an NFS Export. """
    url         = serializers.HyperlinkedIdentityField(view_name="nfsshare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", source="volume.storageobj", queryset=StorageObject.objects.all())

    class Meta:
        model = Export
        fields = ('url', 'id', 'path', 'address', 'options', 'volume')

    def restore_object(self, attrs, instance=None):
        attrs["volume"] = attrs["volume.storageobj"].filesystemvolume_or_none
        del attrs["volume.storageobj"]
        return super(NfsShareSerializer, self).restore_object(attrs, instance)

class NfsShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Export
        fields = ['volume']

class NfsShareViewSet(viewsets.ModelViewSet):
    queryset         = Export.objects.all()
    serializer_class = NfsShareSerializer
    filter_class     = NfsShareFilter


class NfsShareProxyViewSet(RequestHandlers, NfsShareViewSet):
    queryset    = Export.all_objects.all()
    api_prefix  = 'nfsshares'
    host_filter = 'volume__storageobj__host'
    model       = Export


RESTAPI_VIEWSETS = [
    ('nfsshares', NfsShareProxyViewSet, 'nfsshare')
]
