# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from django.db.models import Q
from django.conf import settings

from rest_framework import serializers, viewsets
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework import status

from rest import relations
from rest.restapi import ContentTypeSerializer
from rest.multinode.handlers import RequestHandlers

from volumes import models

from utilities import get_request_query_params, mk_method_field_params, get_request_data

# filter queryset by...
# * is not a physical block device and
# * (has an FSV or a BV) and
# * is not a snapshot and is not named '.snapshots' and
# * does not have an upper volume

VOLUME_FILTER_Q = \
    Q(physicalblockdevice__isnull=True) & \
    Q(Q(filesystemvolume__isnull=False) | Q(blockvolume__isnull=False)) & \
    Q(snapshot__isnull=True) & ~Q(name=".snapshots")


##################################
#            Disk                #
##################################


class PhysicalDiskSerializer(serializers.Serializer):
    """ Serializer for a PhysicalDisk. """

    enclslot = serializers.CharField()
    model = serializers.CharField()
    serial = serializers.CharField()
    type = serializers.CharField()
    rpm = serializers.IntegerField()
    host = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")


class DiskSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a disk. """

    url = serializers.HyperlinkedIdentityField(view_name="disk-detail")
    status = serializers.SerializerMethodField(*mk_method_field_params('status'))
    size = serializers.SerializerMethodField(*mk_method_field_params('size'))

    def to_native(self, obj):
        data = dict([(key, None) for key in ("type", "host")])
        data.update(serializers.HyperlinkedModelSerializer.to_native(self, obj))
        if obj is None:
            return data
        if obj.physicalblockdevice_or_none is not None:
            serializer_instance = PhysicalDiskSerializer(obj.physicalblockdevice_or_none,
                                                         context=self.context)
            data.update(dict([(key, value) for (key, value) in serializer_instance.data.items()
                              if value is not None]))
        return data

    def to_representation(self, instance):
        """DRF 3: `to_native` was replaced by `to_representation`"""
        return self.to_native(instance)

    class Meta:
        model = models.StorageObject
        fields = ('name', 'url', 'id', 'status', 'size')

    def get_size(self, obj):
        return obj.get_size()

    def get_status(self, obj):
        return obj.get_status()


class DiskFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(name="physicalblockdevice__device_type__app_label",
                                     lookup_type="iexact")

    class Meta:
        model = models.StorageObject
        fields = ['name']


class DiskViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(physicalblockdevice__isnull=False)
    serializer_class = DiskSerializer
    filter_class = DiskFilter
    search_fields = ('name',)


class DiskProxyViewSet(RequestHandlers, DiskViewSet):
    api_prefix = 'disks'
    model = models.StorageObject


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
    type = ContentTypeSerializer(read_only=True, source="volumepool_type")
    host = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")


class PoolSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a pool. """

    url = serializers.HyperlinkedIdentityField(view_name="pool-detail")
    volumes = relations.HyperlinkedIdentityField(view_name="pool-volumes")
    source_pool = relations.HyperlinkedRelatedField(view_name="pool-detail", read_only=True,
                                                    source="source_pool.storageobj")
    filesystems = relations.HyperlinkedIdentityField(view_name="pool-filesystems")
    usage = serializers.SerializerMethodField(*mk_method_field_params('usage'))
    status = serializers.SerializerMethodField(*mk_method_field_params('status'))

    class Meta:
        model = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'volumes',
                  'filesystems', 'usage', 'status')

    def to_native(self, obj):
        data = dict([(key, None) for key in ("type", "host")])
        data.update(serializers.HyperlinkedModelSerializer.to_native(self, obj))
        if obj is None:
            return data
        if obj.volumepool_or_none is not None:
            serializer_instance = VolumePoolSerializer(obj.volumepool_or_none, context=self.context)
            data.update(dict([(key, value) for (key, value) in serializer_instance.data.items()
                              if value is not None]))
        return data

    def to_representation(self, instance):
        """DRF 3: `to_native` was replaced by `to_representation`"""
        return self.to_native(instance)

    def get_usage(self, obj):
        return obj.get_volumepool_usage()

    def get_status(self, obj):
        return obj.get_status()


class PoolFilter(django_filters.FilterSet):
    type = django_filters.CharFilter(name="volumepool__volumepool_type__app_label",
                                     lookup_type="iexact")

    class Meta:
        model = models.StorageObject
        fields = ['name', 'uuid', 'createdate']


class PoolViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(volumepool__isnull=False)
    serializer_class = PoolSerializer
    filter_class = PoolFilter
    search_fields = ('name',)

    def create(self, request, *args, **kwargs):
        vp_so = models.create_volumepool(
            [models.StorageObject.objects.get(id=disk_id)
                for disk_id in get_request_data(request).get("disks", [])],
            dict(get_request_data(request).get('options', {}),
                 name=get_request_data(request)["name"]))
        serializer = PoolSerializer(vp_so, many=False, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @detail_route()
    def volumes(self, request, *args, **kwargs):
        pool = self.get_object()
        serializer_instance = VolumeSerializer(pool.volumepool.volume_set.filter(VOLUME_FILTER_Q),
                                               many=True, context={"request": request})
        return Response(serializer_instance.data)

    @detail_route()
    def filesystems(self, request, *args, **kwargs):
        obj = self.get_object()
        pool = models.VolumePool.objects.get(id=obj.volumepool.id)
        fss = {fs.name: fs.desc for fs in pool.volumepool.get_supported_filesystems()}
        return Response(fss)

    @detail_route()
    def storage(self, request, *args, **kwargs):
        return Response(models.get_storage_tree(self.get_object().authoritative_obj))


class PoolProxyViewSet(RequestHandlers, PoolViewSet):
    api_prefix = 'pools'
    model = models.StorageObject

    @detail_route()
    def volumes(self, request, *args, **kwargs):
        return self.retrieve(request, 'volumes', *args, **kwargs)

    @detail_route()
    def filesystems(self, request, *args, **kwargs):
        return self.retrieve(request, 'filesystems', *args, **kwargs)

    @detail_route()
    def storage(self, request, *args, **kwargs):
        return self.retrieve(request, 'storage', *args, **kwargs)

    @staticmethod
    def get_host_by_data(data):
        return models.StorageObject.objects.get(id=data["disks"][0]).host


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
    type = serializers.SerializerMethodField("serialize_type")
    host = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path = serializers.CharField()
    fswarning = serializers.IntegerField()
    fscritical = serializers.IntegerField()
    owner = relations.HyperlinkedRelatedField(read_only=True, view_name="user-detail")

    def serialize_type(self, obj):
        ser = ContentTypeSerializer(obj.volume_type, many=False, context=self.context)
        data = ser.data
        if isinstance(obj, models.FileSystemProvider):
            data["name"] = obj.fstype
        return data


class BlockVolumeSerializer(serializers.Serializer):
    type = ContentTypeSerializer(read_only=True, source="volume_type")
    host = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")
    path = serializers.CharField()
    perfdata = serializers.SerializerMethodField('get_performance_data')

    def get_performance_data(self, obj):
        return obj.perfdata


class VolumePoolRootVolumeSerializer(serializers.Serializer):
    type = serializers.CharField(source="volumepool_type")
    host = relations.HyperlinkedRelatedField(read_only=True, view_name="host-detail")


class VolumeSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for a volume.

        Of course, there is no such thing as "a volume" in the models layer,
        but we'd like to hide that complexity from our users so as to not
        drive everyone completely insane. We shall do this by first using
        our own serialization powers for the underlying StorageObject, and
        then allowing higher-level serializers to add more information.
    """

    url = serializers.HyperlinkedIdentityField(view_name="volume-detail")
    storage = relations.HyperlinkedIdentityField(view_name="volume-storage")
    snapshots = relations.HyperlinkedIdentityField(view_name="volume-snapshots")

    source_pool = relations.HyperlinkedRelatedField(view_name="pool-detail", read_only=True,
                                                    source="source_pool.storageobj")
    usage = serializers.SerializerMethodField(*mk_method_field_params('usage'))
    status = serializers.SerializerMethodField(*mk_method_field_params('status'))
    upper = relations.HyperlinkedRelatedField(view_name="volume-detail",
                                              queryset=models.StorageObject.objects.all())

    class Meta:
        model = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'snapshots', 'usage',
                  'status', 'is_protected', 'upper', 'storage')

    def to_native(self, obj):
        data = dict([(key, None) for key in ("type", "host", "path",
                     "fswarning", "fscritical", "owner")])
        data.update(serializers.HyperlinkedModelSerializer.to_native(self, obj))
        if obj is None:
            return data
        for (Serializer, top_obj, flag) in (
                (VolumePoolRootVolumeSerializer, obj.volumepool_or_none, "is_volumepool"),
                (BlockVolumeSerializer, obj.blockvolume_or_none, "is_blockvolume"),
                (FileSystemVolumeSerializer, obj.filesystemvolume_or_none, "is_filesystemvolume")):
            if top_obj is None:
                data[flag] = False
                continue
            serializer_instance = Serializer(top_obj, context=self.context)
            data.update(dict([(key, value) for (key, value) in serializer_instance.data.items()
                              if value is not None]))
            data[flag] = True
        return data

    def to_representation(self, instance):
        """DRF 3: `to_native` was replaced by `to_representation`"""
        return self.to_native(instance)

    def get_usage(self, obj):
        return obj.get_volume_usage()

    def get_status(self, obj):
        return obj.get_status()


class SnapshotSerializer(VolumeSerializer):
    """ Serializer for a Snapshot. """
    url = serializers.HyperlinkedIdentityField(view_name="snapshot-detail")
    snapshot = relations.HyperlinkedRelatedField(view_name="volume-detail", read_only=True)

    class Meta:
        model = models.StorageObject
        fields = ('url', 'id', 'name', 'uuid', 'createdate', 'source_pool', 'snapshot', 'usage',
                  'status')


class SnapshotViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(snapshot__isnull=False)
    serializer_class = SnapshotSerializer
    filter_fields = ('name', 'uuid', 'createdate', 'snapshot')
    search_fields = ('name',)

    def create(self, request, *args, **kwargs):
        volume_so = self.origin.create_snapshot(get_request_data(request)["name"],
                                                get_request_data(request)["megs"], {})
        serializer = SnapshotSerializer(volume_so, many=False, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        options = {"name": get_request_data(request)["name"]}

        storageobj = self.get_object()
        clone = storageobj.clone(None, options)

        serializedClone = SnapshotSerializer(clone, many=False, context={"request": request})

        return Response(serializedClone.data, status=status.HTTP_201_CREATED)


class SnapshotProxyViewSet(RequestHandlers, SnapshotViewSet):
    api_prefix = 'snapshots'
    host_filter = 'source_pool__volumepool__host'
    model = models.StorageObject

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        return self.retrieve(request, 'clone', *args, **kwargs)


class VolumeViewSet(viewsets.ModelViewSet):
    queryset = models.StorageObject.objects.filter(VOLUME_FILTER_Q)
    serializer_class = VolumeSerializer
    filter_fields = ('name', 'uuid', 'createdate')
    search_fields = ('name',)

    def filter_queryset(self, queryset):
        filter_value = get_request_query_params(self.request).get('upper__isnull')
        if filter_value:
            if filter_value.lower() == 'true':
                filter = True
            else:
                filter = False
            queryset = queryset.filter(upper__isnull=filter)

        filter_value = get_request_query_params(self.request).get('upper__id')
        if filter_value:
            queryset = queryset.filter(upper__id=filter_value)

        return super(VolumeViewSet, self).filter_queryset(queryset)

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        options = {"name": get_request_data(request)["name"]}

        storageobj = self.get_object()
        clone = storageobj.clone(None, options)

        serializedClone = VolumeSerializer(clone, many=False, context={"request": request})

        return Response(serializedClone.data, status=status.HTTP_201_CREATED)

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

    def create(self, request, *args, **kwargs):
        storageobj = models.StorageObject.all_objects.get(
            id=get_request_data(request)["source_pool"]["id"])

        volume = storageobj.create_volume(get_request_data(request)["name"],
                                          get_request_data(request)["megs"], {
            "owner": request.user,
            "fswarning": 75,
            "fscritical": 85,
            "filesystem": get_request_data(request).get("filesystem", None),
            "is_protected": get_request_data(request).get('is_protected', False)
            })
        serializer = VolumeSerializer(volume, many=False, context={"request": request})

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        storageobj = models.StorageObject.objects.get(id=get_request_data(request)["id"])

        if "filesystem" in get_request_data(request):
            storageobj.create_filesystem(get_request_data(request)["filesystem"], {
                "owner": request.user,
                "fswarning": 75,
                "fscritical": 85,
            })

        if "megs" in get_request_data(request):
            storageobj.resize(int(get_request_data(request)["megs"]))

        if "is_protected" in get_request_data(request):
            storageobj.is_protected = get_request_data(request)["is_protected"]
            storageobj.save()

        volume = VolumeSerializer(storageobj, many=False, context={"request": request})
        return Response(volume.data, status=status.HTTP_200_OK)


class VolumeProxyViewSet(RequestHandlers, VolumeViewSet):
    api_prefix = 'volumes'
    host_filter = 'source_pool'
    model = models.StorageObject

    @detail_route(["post"])
    def clone(self, request, *args, **kwargs):
        return self.retrieve(request, 'clone', *args, **kwargs)

    @detail_route(["get", "post"])
    def snapshots(self, request, *args, **kwargs):
        return self.retrieve(request, 'snapshots', *args, **kwargs)

    @detail_route()
    def storage(self, request, *args, **kwargs):
        return self.retrieve(request, 'storage', *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if "drbd" in settings.INSTALLED_APPS:
            obj = self.get_object()
            blockvolume = obj.blockvolume_or_none

            from drbd.models import Connection
            if blockvolume and type(blockvolume) == Connection:
                # might be a remote_request
                return self._remote_request(request, blockvolume.host, api_prefix="mirrors",
                                            obj=blockvolume)
        return super(VolumeProxyViewSet, self).destroy(request, args, kwargs)


RESTAPI_VIEWSETS = [
    ('disks',     DiskProxyViewSet,     'disk'),
    ('pools',     PoolProxyViewSet,     'pool'),
    ('volumes',   VolumeProxyViewSet,   'volume'),
    ('snapshots', SnapshotProxyViewSet, 'snapshot'),
]
