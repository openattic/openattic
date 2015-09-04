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
from rest import relations

class IPAddressSerializer(serializers.ModelSerializer):
    device        = relations.HyperlinkedRelatedField(view_name='netdevice-detail', many=False, read_only=False)

    class Meta:
        model = models.IPAddress

class NetDeviceSerializer(serializers.HyperlinkedModelSerializer):
    ipaddress_set = relations.HyperlinkedRelatedField(view_name='ipaddress-detail', many=True,  read_only=True)
    host          = relations.HyperlinkedRelatedField(view_name='host-detail', many=False, read_only=False)

    class Meta:
        model = models.NetDevice

class HostSerializer(serializers.HyperlinkedModelSerializer):
    url                 = serializers.HyperlinkedIdentityField(view_name='host-detail')
    netdevice_set       = relations.HyperlinkedRelatedField(view_name='netdevice-detail', many=True, read_only=True)
    hostgroup_set       = relations.HyperlinkedRelatedField(view_name='hostgroup-detail', many=True, read_only=True)
    primary_ip_address  = serializers.SerializerMethodField("serialize_primaryip")

    class Meta:
        model = models.Host
        fields = ('id', 'name', 'url', 'netdevice_set', 'hostgroup_set', 'primary_ip_address')

    def serialize_primaryip(self, obj):
        host = models.Host.objects.get(id=obj.id)

        try:
            ip = host.get_primary_ip_address()
        except models.IPAddress.DoesNotExist:
            return None
        else:
            serializer = IPAddressSerializer(ip, many=False, context=self.context)
            return serializer.data

class HostGroupSerializer(serializers.ModelSerializer):
    hosts = relations.HyperlinkedRelatedField(view_name='host-detail', many=True , read_only=True)

    class Meta:
        model = models.HostGroup

class IPAddressViewSet(viewsets.ModelViewSet):
    queryset = models.IPAddress.objects.all()
    serializer_class = IPAddressSerializer

class NetDeviceViewSet(viewsets.ModelViewSet):
    queryset = models.NetDevice.objects.all()
    serializer_class = NetDeviceSerializer

class HostViewSet(viewsets.ModelViewSet):
    queryset = models.Host.objects.all()
    serializer_class = HostSerializer
    filter_fields = ('name',)
    search_fields = ('name',)

class HostGroupViewSet(viewsets.ModelViewSet):
    queryset = models.HostGroup.objects.all()
    serializer_class = HostGroupSerializer


RESTAPI_VIEWSETS = [
    ('hosts', HostViewSet),
    ('hostgroups', HostGroupViewSet),
    ('netdevices', NetDeviceViewSet),
    ('ipaddresses', IPAddressViewSet),
]