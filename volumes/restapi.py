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


class FileSystemVolumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FileSystemVolume

class BlockVolumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.BlockVolume

class VolumePoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolumePool

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
