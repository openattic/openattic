
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

from volumes.models import StorageObject

from nfs.models import Export

class NfsShareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a NFS Export. """
    url         = serializers.HyperlinkedIdentityField(view_name="nfsshare-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True, source="volume.storageobj")

    class Meta:
        model = Export
        fields = ('url', 'id', 'path', 'address', 'options', 'volume')

class NfsShareFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = Export
        fields = ['volume']

class NfsShareViewSet(viewsets.ModelViewSet):
    queryset         = Export.objects.all()
    serializer_class = NfsShareSerializer
    filter_class     = NfsShareFilter

    def create(self, request, *args, **kwargs):
        nfs_data        = request.DATA
        storageobj_data = request.QUERY_PARAMS
        storageobj      = StorageObject.objects.get(id=storageobj_data["id"])
        volume          = storageobj.filesystemvolume_or_none.volume

        if volume:
            export = Export(volume=volume,
                            path=volume.path,
                            address=nfs_data["address"],
                            options=nfs_data["options"])
            export.save()
            return Response(True)

        return Response(False)


RESTAPI_VIEWSETS = [
    ('nfsshares', NfsShareViewSet, 'nfsshare')
]
