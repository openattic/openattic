# -*- coding: utf-8 -*-
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

import django_filters

from rest_framework import serializers, viewsets, status
from rest_framework.response import Response

from rest import relations

from peering.models import PeerHost

class PeerHostSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a PeerHost. """
    url         = serializers.HyperlinkedIdentityField(view_name="nfsshare-detail")
    host        = relations.HyperlinkedRelatedField(view_name="host-detail")

    class Meta:
        model = PeerHost
        fields = ('url', 'id', 'host', 'base_url')


class PeerHostViewSet(viewsets.ModelViewSet):
    queryset         = PeerHost.objects.all()
    serializer_class = PeerHostSerializer
    filter_fields = ('host', 'base_url')


RESTAPI_VIEWSETS = [
    ('peers', PeerHostViewSet, 'peer')
]
