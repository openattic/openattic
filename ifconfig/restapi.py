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

from rest_framework import serializers, viewsets

from ifconfig import models

class IPAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.IPAddress

class NetDeviceSerializer(serializers.ModelSerializer):
    ipaddress_set = serializers.HyperlinkedRelatedField(view_name='ipaddress-detail', many=True)

    class Meta:
        model = models.NetDevice

class HostSerializer(serializers.ModelSerializer):
    netdevice_set = serializers.HyperlinkedRelatedField(view_name='netdevice-detail', many=True)

    class Meta:
        model = models.Host

class IPAddressViewSet(viewsets.ModelViewSet):
    queryset = models.IPAddress.objects.all()
    serializer_class = IPAddressSerializer

class NetDeviceViewSet(viewsets.ModelViewSet):
    queryset = models.NetDevice.objects.all()
    serializer_class = NetDeviceSerializer

class HostViewSet(viewsets.ModelViewSet):
    queryset = models.Host.objects.all()
    serializer_class = HostSerializer


RESTAPI_VIEWSETS = [
    ('hosts', HostViewSet),
    ('netdevices', NetDeviceViewSet),
    ('ipaddresses', IPAddressViewSet),
]