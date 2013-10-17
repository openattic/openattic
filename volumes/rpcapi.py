# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

from rpcd.handlers import BaseHandler, ModelHandler
from rpcd.handlers import ProxyModelHandler

from volumes.models import GenericDisk, VolumePool, BlockVolume, FileSystemVolume, FileSystemProvider
from ifconfig.models import Host

class GenericDiskHandler(ModelHandler):
    model = GenericDisk

    def _override_get(self, obj, data):
        data["name"] = obj.name
        data["megs"] = obj.megs
        return data

class VolumePoolHandler(ModelHandler):
    model = VolumePool

    def _idobj(self, obj):
        if obj.volumepool is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volumepool.__class__)
        return handler._idobj(obj.volumepool)

    def _override_get(self, obj, data):
        if obj.volumepool is not None:
            handler = self._get_handler_instance(obj.volumepool.__class__)
            data = handler._getobj(obj.volumepool)
        data["member_set"] = []
        for member in obj.member_set.all():
            handler = self._get_handler_instance(member.__class__)
            data["member_set"].append( handler._idobj(member) )
        return data

    def get_status(self, id):
        obj = VolumePool.objects.get(id=id)
        return {
            "status":    obj.volumepool.status,
            "megs":      obj.volumepool.megs,
            "usedmegs":  obj.volumepool.usedmegs,
            "type":      obj.volumepool.type,
        }


class VolumePoolProxy(ProxyModelHandler, VolumePoolHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volumepool.host == Host.objects.get_current():
            return None
        return model.volumepool.host.peerhost_set.all()[0]



class BlockVolumeHandler(ModelHandler):
    model = BlockVolume

    def _idobj(self, obj):
        if obj.volume is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._idobj(obj.volume)

    def _override_get(self, obj, data):
        if obj.volume is None:
            return data
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._getobj(obj.volume)


class FileSystemVolumeHandler(ModelHandler):
    model = FileSystemVolume

    def _idobj(self, obj):
        if obj.volume is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._idobj(obj.volume)

    def _override_get(self, obj, data):
        if obj.volume is not None:
            handler = self._get_handler_instance(obj.volume.__class__)
            data = handler._getobj(obj.volume)
        data["name"] = obj.volume.name
        data["megs"] = obj.volume.megs
        data["host"] = self._get_handler_instance(Host)._idobj(obj.volume.host)
        return data


class FileSystemProviderHandler(ModelHandler):
    model = FileSystemProvider

    def _override_get(self, obj, data):
        hosthandler = self._get_handler_instance(Host)
        data['filesystem'] = obj.fsname
        data['fs'] = {
            'mountpoint':  obj.mountpoint,
            'mounted':     obj.mounted,
            'host':        hosthandler._idobj(obj.mounthost)
            }
        if obj.mounted:
            data['fs']['stat'] = obj.stat
        # FileSystemProvider.volume always points to self
        del data["volume_type"]
        del data["volume"]
        return data


RPCD_HANDLERS = [
    GenericDiskHandler,
    VolumePoolProxy,
    BlockVolumeHandler,
    FileSystemVolumeHandler,
    FileSystemProviderHandler,
    ]
