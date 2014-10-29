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

from django.contrib.auth.models import User
from rest_framework import serializers, viewsets
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from volumes import models


class AbstractFileSystemVolumeSerializer(serializers.Serializer):
    host        = serializers.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path        = serializers.CharField()
    #mounted     = serializers.BooleanField()
    #usedmegs    = serializers.Field()
    status      = serializers.Field()

class FileSystemVolumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FileSystemVolume

    owner       = serializers.HyperlinkedRelatedField(view_name="user-detail")
    volume_type = serializers.HyperlinkedRelatedField(view_name="contenttype-detail")
    volume      = serializers.SerializerMethodField("serialize_volume")

    def serialize_volume(self, obj):
        ser = AbstractFileSystemVolumeSerializer(obj.volume, context=self.context)
        return ser.data



class AbstractBlockVolumeSerializer(serializers.Serializer):
    host        = serializers.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path        = serializers.CharField()
    status      = serializers.Field()

class BlockVolumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BlockVolume

    volume      = serializers.SerializerMethodField("serialize_volume")
    volume_type = serializers.HyperlinkedRelatedField(view_name="contenttype-detail")

    def serialize_volume(self, obj):
        ser = AbstractBlockVolumeSerializer(obj.volume, context=self.context)
        return ser.data



class AbstractVolumePoolSerializer(serializers.Serializer):
    host        = serializers.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    usedmegs    = serializers.Field()
    status      = serializers.Field()

class VolumePoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolumePool

    volumepool  = serializers.SerializerMethodField("serialize_volumepool")
    volumepool_type = serializers.HyperlinkedRelatedField(view_name="contenttype-detail")

    def serialize_volumepool(self, obj):
        ser = AbstractVolumePoolSerializer(obj.volumepool, context=self.context)
        return ser.data



class StorageObjectSerializer(serializers.ModelSerializer):
    volumepool          = VolumePoolSerializer()
    filesystemvolume    = FileSystemVolumeSerializer()
    blockvolume         = BlockVolumeSerializer()

    class Meta:
        model = models.StorageObject

class StorageObjectViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.all()
    serializer_class = StorageObjectSerializer


RESTAPI_VIEWSETS = [
    ('volumes', StorageObjectViewSet),
]
