
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
from rest_framework.response import Response

from rest import relations

from nfs.models import Export

class NfsshareSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a NFS Export. """
    url           = serializers.HyperlinkedIdentityField(view_name="nfsshare-detail")

    class Meta:
        model = Export
        fields = ('url', 'id', 'path', 'address', 'options')


class NfsshareViewSet(viewsets.ModelViewSet):
    queryset         = Export.objects.all()
    serializer_class = NfsshareSerializer

    def create(self, request, *args, **kwargs):
        print request.items()
        print "create NFS share"
        return Response(True)


RESTAPI_VIEWSETS = [
    ('nfsshares', NfsshareViewSet, 'nfsshare')
]
