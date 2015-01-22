
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

from lio.models import HostACL

class HostACLSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a HostACL. """
    url         = serializers.HyperlinkedIdentityField(view_name="lun-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True, source="volume.storageobj")
    host        = relations.HyperlinkedRelatedField(view_name="host-detail",   read_only=True)

    class Meta:
        model = HostACL
        # TODO: add portals
        fields = ('url', 'id', 'host', 'volume', 'lun_id')

class HostACLFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = HostACL
        fields = ['volume']

class HostACLViewSet(viewsets.ModelViewSet):
    queryset         = HostACL.objects.all()
    serializer_class = HostACLSerializer
    filter_class     = HostACLFilter

    def create(self, request, *args, **kwargs):
        print request.items()
        print "create HostACL"
        return Response(True)


RESTAPI_VIEWSETS = [
    ('luns', HostACLViewSet, 'lun')
]
