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

from django.http import Http404
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType

from rest_framework import serializers, viewsets, generics
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED

from rest import relations
from rest.restapi import ContentTypeSerializer

from volumes import models


# filter queryset by...
# * (has an FSV or a BV) and
# * is not a snapshot and is not named '.snapshots' and
# * does not have an upper volume
VOLUME_FILTER_Q = \
    Q(Q(filesystemvolume__isnull=False) | Q(blockvolume__isnull=False)) & \
    Q(snapshot__isnull=True) & ~Q(name=".snapshots") & \
    Q(upper__isnull=True)



##################################
#            Pool                #
##################################


# Pool fields
#                 Writeable...
#   Field         Create  Edit  Source (A -> B = B overrides A)
#   name          x             SO
#   megs          x       x
#   uuid                        SO
#   createdate                  SO
#   source_pool   x             SO
#   snapshot      x             SO
#   status                      SO
#   type          x                   VP
#   host                              VP
#

class VolumePoolSerializer(serializers.Serializer):
    type        = ContentTypeSerializer(read_only=True, source="volumepool_type")
    host        = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")


class PoolSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a pool. """

    url         = serializers.HyperlinkedIdentityField(view_name="pool-detail")
    volumes     = relations.HyperlinkedIdentityField(view_name="pool-volumes")
    source_pool = relations.HyperlinkedRelatedField(view_name="pool-detail", read_only=True)
    filesystems = relations.HyperlinkedIdentityField(view_name="pool-filesystems")
    usage       = serializers.SerializerMethodField("get_usage")
    status      = serializers.SerializerMethodField("get_status")

    class Meta:
        model  = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'volumes', 'filesystems', 'usage', 'status')

    def to_native(self, obj):
        data = dict([(key, None) for key in ("type", "host")])
        data.update(serializers.HyperlinkedModelSerializer.to_native(self, obj))
        if obj is None:
            return data
        if obj.volumepool_or_none is not None:
            serializer_instance = VolumePoolSerializer(obj.volumepool_or_none, context=self.context)
            data.update(dict([(key, value) for (key, value) in serializer_instance.data.items() if value is not None]))
        return data

    def get_usage(self, obj):
        return obj.get_volumepool_usage()

    def get_status(self, obj):
        return obj.get_status()


class PoolViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(volumepool__isnull=False)
    serializer_class = PoolSerializer
    filter_fields = ('name', 'uuid', 'createdate')
    search_fields = ('name',)

    @detail_route()
    def volumes(self, request, *args, **kwargs):
        pool = self.get_object()
        serializer_instance = VolumeSerializer(pool.volumepool.volume_set.filter(VOLUME_FILTER_Q), many=True, context={"request": request})
        return Response(serializer_instance.data)

    @detail_route()
    def filesystems(self, *args, **kwargs):
        obj = self.get_object()
        pool = models.VolumePool.objects.get(id=obj.volumepool.id)
        fss = {fs.name: fs.desc for fs in pool.volumepool.get_supported_filesystems()}
        return Response(fss)

    @detail_route()
    def storage(self, request, *args, **kwargs):
        return Response(models.get_storage_tree(self.get_object().authoritative_obj))


##################################
#            Volume              #
##################################


# Volume fields
#                 Writeable...
#   Field         Create  Edit  Source (A -> B = B overrides A)
#   name          x             SO
#   megs          x       x
#   uuid                        SO
#   createdate                  SO
#   source_pool   x             SO
#   snapshot      x             SO
#   status                      SO
#   type          x                   VP -> BV -> FSV.type -> FSV.volume.fstype
#   host                              VP -> BV -> FSV
#   path                                    BV -> FSV
#   fswarning     x       x                       FSV
#   fscritical    x       x                       FSV
#   owner(name)   x                               FSV
#

class FileSystemVolumeSerializer(serializers.Serializer):
    type        = serializers.SerializerMethodField("serialize_type")
    host        = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path        = serializers.CharField()
    fswarning   = serializers.IntegerField()
    fscritical  = serializers.IntegerField()
    owner       = relations.HyperlinkedRelatedField(read_only=True, view_name="user-detail")

    def serialize_type(self, obj):
        ser = ContentTypeSerializer(obj.volume_type, many=False, context=self.context)
        data = ser.data
        if isinstance(obj, models.FileSystemProvider):
            data["name"] = obj.fstype
        return data


class BlockVolumeSerializer(serializers.Serializer):
    type        = ContentTypeSerializer(read_only=True, source="volume_type")
    host        = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path        = serializers.CharField()
    perfdata    = serializers.SerializerMethodField('get_performance_data')

    def get_performance_data(self, obj):
        return obj.perfdata


class VolumePoolRootVolumeSerializer(serializers.Serializer):
    type        = serializers.CharField(source="volumepool_type")
    host        = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")


class VolumeSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a volume.

        Of course, there is no such thing as "a volume" in the models layer,
        but we'd like to hide that complexity from our users so as to not
        drive everyone completely insane. We shall do this by first using
        our own serialization powers for the underlying StorageObject, and
        then allowing higher-level serializers to add more information.
    """

    url         = serializers.HyperlinkedIdentityField(view_name="volume-detail")
    services    = relations.HyperlinkedIdentityField(view_name="volume-services")
    storage     = relations.HyperlinkedIdentityField(view_name="volume-storage")
    snapshots   = relations.HyperlinkedIdentityField(view_name="volume-snapshots")
    snapshot    = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True)
    source_pool = relations.HyperlinkedRelatedField(view_name="pool-detail",   read_only=True)
    usage       = serializers.SerializerMethodField("get_usage")
    status      = serializers.SerializerMethodField("get_status")

    class Meta:
        model  = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'snapshots', 'services', 'usage', 'status')

    def to_native(self, obj):
        data = dict([(key, None) for key in ("type", "host", "path",
                     "fswarning", "fscritical", "owner")])
        data.update(serializers.HyperlinkedModelSerializer.to_native(self, obj))
        if obj is None:
            return data
        for (Serializer, top_obj, flag) in (
                (VolumePoolRootVolumeSerializer, obj.volumepool_or_none,       "is_volumepool"),
                (BlockVolumeSerializer,          obj.blockvolume_or_none,      "is_blockvolume"),
                (FileSystemVolumeSerializer,     obj.filesystemvolume_or_none, "is_filesystemvolume")):
            if top_obj is None:
                data[flag] = False
                continue
            serializer_instance = Serializer(top_obj, context=self.context)
            data.update(dict([(key, value) for (key, value) in serializer_instance.data.items() if value is not None]))
            data[flag] = True
        return data

    def get_usage(self, obj):
        return obj.get_volume_usage()

    def get_status(self, obj):
        return obj.get_status()


class SnapshotSerializer(VolumeSerializer):
    """ Serializer for a Snapshot. """
    url         = serializers.HyperlinkedIdentityField(view_name="snapshot-detail")

    class Meta:
        model  = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'snapshot', 'services', 'usage', 'status')


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(snapshot__isnull=False)
    serializer_class = SnapshotSerializer
    filter_fields = ('name', 'uuid', 'createdate')
    search_fields = ('name',)

    def create(self, request, *args, **kwargs):
        volume_so = self.origin.create_snapshot(request.DATA["name"], request.DATA["megs"], {})
        serializer = SnapshotSerializer(volume_so, many=False, context={"request": request})
        return Response(serializer.data, status=HTTP_201_CREATED)

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        options = {"name": request.DATA["name"]}

        storageobj = self.get_object()
        clone = storageobj.clone(None, options)

        serializedClone = SnapshotSerializer(clone, many=False, context={"request": request})

        return Response(serializedClone.data, status=HTTP_201_CREATED)

class VolumeViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(VOLUME_FILTER_Q)
    serializer_class = VolumeSerializer
    filter_fields = ('name', 'uuid', 'createdate')
    search_fields = ('name',)

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        options = {"name": request.DATA["name"]}

        storageobj = self.get_object()
        clone = storageobj.clone(None, options)

        serializedClone = VolumeSerializer(clone, many=False, context={"request": request})

        return Response(serializedClone.data, status=HTTP_201_CREATED)

    @detail_route(["get", "post"])
    def snapshots(self, request, *args, **kwargs):
        origin = self.get_object()
        ViewSet = type("VolumeSnapshotViewSet", (SnapshotViewSet,), {
            "queryset": origin.snapshot_storageobject_set.all(),
            "origin":   origin
            })
        return ViewSet.as_view({'get': 'list', 'post': 'create'})(request, *args, **kwargs)

    @detail_route()
    def storage(self, request, *args, **kwargs):
        return Response(models.get_storage_tree(self.get_object().authoritative_obj))

    @detail_route()
    def services(self, request, *args, **kwargs):
        try:
            from nagios.models  import Service
            from nagios.restapi import ServiceSerializer
        except ImportError:
            # no nagios app then, apparently
            raise Http404

        storageobj = self.get_object()

        def serialize_volume_service(volume):
            """ `volume' is either a filesystemvolume or a blockvolume instance, or None. """
            if volume is None:
                return []
            ct = ContentType.objects.get_for_model(type(volume))
            serializer_instance = ServiceSerializer(
                Service.objects.filter(target_id=volume.id, target_type=ct),
                many=True, context={"request": request})
            return serializer_instance.data

        return Response({
            "blockvolume":      serialize_volume_service(storageobj.blockvolume_or_none),
            "filesystemvolume": serialize_volume_service(storageobj.filesystemvolume_or_none),
        })

    def create(self, request, *args, **kwargs):
        storageobj = models.StorageObject.all_objects.get(id=request.DATA["source_pool"]["id"])

        volume = storageobj.create_volume(request.DATA["name"], request.DATA["megs"], {
            "owner": request.user,
            "fswarning" : 75,
            "fscritical": 85,
            "filesystem": request.DATA.get("filesystem", None)
            })
        serializer = VolumeSerializer(volume, many=False, context={"request": request})

        return Response(serializer.data, status=HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        storageobj = models.StorageObject.objects.get(id=request.DATA["id"])

        if "filesystem" in request.DATA:
            storageobj.create_filesystem(request.DATA["filesystem"], {
                "owner"     : request.user,
                "fswarning" : 75,
                "fscritical": 85,
            })

        if "megs" in request.DATA:
            storageobj.resize(int(request.DATA["megs"]))

        volume = VolumeSerializer(storageobj, many=False, context={"request": request})
        return Response(volume.data)


RESTAPI_VIEWSETS = [
    ('pools',     PoolViewSet,     'pool'),
    ('volumes',   VolumeViewSet,   'volume'),
    ('snapshots', SnapshotViewSet, 'snapshot'),
]
