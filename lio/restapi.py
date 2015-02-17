
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
from lio.models import HostACL, Initiator

class HostACLSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a HostACL. """
    url         = serializers.HyperlinkedIdentityField(view_name="lun-detail")
    volume      = relations.HyperlinkedRelatedField(view_name="volume-detail", source="volume.storageobj", queryset=StorageObject.objects.all())
    host        = relations.HyperlinkedRelatedField(view_name="host-detail")

    class Meta:
        model = HostACL
        # TODO: add portals
        fields = ('url', 'id', 'host', 'volume', 'lun_id')

    def restore_object(self, attrs, instance=None):
        attrs["volume"] = attrs["volume.storageobj"].blockvolume_or_none
        del attrs["volume.storageobj"]
        return super(HostACLSerializer, self).restore_object(attrs, instance)

class HostACLFilter(django_filters.FilterSet):
    volume = django_filters.NumberFilter(name="volume__storageobj__id")

    class Meta:
        model  = HostACL
        fields = ['volume']

class HostACLViewSet(viewsets.ModelViewSet):
    queryset         = HostACL.objects.all()
    serializer_class = HostACLSerializer
    filter_class     = HostACLFilter


class InitiatorSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a Initiator. """
    url         = serializers.HyperlinkedIdentityField(view_name="nfsshare-detail")
    host        = relations.HyperlinkedRelatedField(view_name="host-detail")

    class Meta:
        model = Initiator
        fields = ('url', 'id', 'host', 'wwn', 'type')


class InitiatorViewSet(viewsets.ModelViewSet):
    queryset         = Initiator.objects.all()
    serializer_class = InitiatorSerializer
    filter_fields = ('host', 'wwn', 'type')


RESTAPI_VIEWSETS = [
    ('luns', HostACLViewSet, 'lun'),
    ('initiators', InitiatorViewSet, 'initiator')
]
