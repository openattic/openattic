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

import logging

from django.contrib.contenttypes.models import ContentType

from rpcd.handlers import BaseHandler, ModelHandler
from rpcd.handlers import ProxyModelHandler

from volumes.models import GenericDisk, StorageObject, VolumePool, BlockVolume, FileSystemVolume, FileSystemProvider
from volumes import initscripts
from ifconfig.models import Host


# This module actually does two things.
# First of all, we want each and every volumepool and volume to provide the same set
# of basic fields, which are defined in volumes/models.py.
# Second, we want the BlockVolume and FileSystemVolume handlers to return exactly
# what the various handlers would return.
#
# To achieve this, we define a set of Abstract*Handlers from which the concrete
# handlers (i.e., VgHandler, LvHandler, ZpoolHandler etc) are derived. Those handlers
# override _getobj to make sure a certain set of fields is always set.
#
# Concrete handlers in this module are implemented by selecting the appropriate
# handler based on the volume(pool) type, and then calling that handler to get the
# actual results.


class AbstractVolumePoolHandler(ModelHandler):
    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["usedmegs"] = obj.volumepool.usedmegs
        try:
            data["member_set"] = [
                self._get_handler_instance(member.__class__)._idobj(member)
                for member in obj.member_set.all()
                ]
        except ValueError, err:
            logging.error(unicode(err))
        return data

    def get_status(self, id):
        obj = VolumePool.objects.get(id=id)
        return {
            "status":    obj.volumepool.status,
            "megs":      obj.volumepool.megs,
            "usedmegs":  obj.volumepool.usedmegs,
            "type":      obj.volumepool.type,
        }

class VolumePoolHandler(ModelHandler):
    model = VolumePool

    def _idobj(self, obj):
        if obj.volumepool is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volumepool.__class__)
        return handler._idobj(obj.volumepool)

    def _getobj(self, obj):
        if obj.volumepool is None:
            return ModelHandler._getobj(self, obj)
        handler = self._get_handler_instance(obj.volumepool.__class__)
        return handler._getobj(obj.volumepool)

    def get_status(self, id):
        obj = VolumePool.objects.get(id=id)
        return {
            "status":    obj.volumepool.status,
            "megs":      obj.volumepool.megs,
            "usedmegs":  obj.volumepool.usedmegs,
            "type":      obj.volumepool.type,
        }

    def create_volume(self, id, name, megs, owner, filesystem, fswarning, fscritical):
        obj = VolumePool.objects.get(id=id)
        owner = ModelHandler._get_object_by_id_dict(owner)
        vol = obj.volumepool.create_volume(name, megs, owner, filesystem, fswarning, fscritical)
        handler = self._get_handler_instance(vol.__class__)
        return handler._idobj(vol)

    def get_sufficient(self, host_id, min_megs):
        volumepools = VolumePool.all_objects.all()
        host = Host.objects.get(id=host_id)
        result_pools = []
        for volumepool in volumepools:
            if volumepool.volumepool.host == host:
                status = self.get_status(volumepool.id)
                if status["megs"] is not None and status["usedmegs"] is not None:
                    free_megs = status["megs"] - status["usedmegs"]
                    if free_megs >= float(min_megs):
                        result_pools.append(self._getobj(volumepool))
        return result_pools

    def get_supported_filesystems(self, id):
        """ Return filesystems supported by a given Volume Pool. """
        obj = VolumePool.objects.get(id=id)
        return [{"name": fs.name} for fs in obj.volumepool.get_supported_filesystems()]

class VolumePoolProxy(ProxyModelHandler, VolumePoolHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volumepool is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete volumepool" % (type(model), model.id))
            return None
        if model.volumepool.host == Host.objects.get_current():
            return None
        return model.volumepool.host.peerhost_set.all()[0]

    def get_status(self, id):
        return self._call_singlepeer_method("get_status", id)

    def get_supported_filesystems(self, id):
        return self._call_singlepeer_method("get_supported_filesystems", id)

    def create_volume(self, id, name, megs, owner, filesystem, fswarning, fscritical):
        return self._call_singlepeer_method("create_volume", id, name, megs, owner, filesystem, fswarning, fscritical)


class AbstractBlockVolumeHandler(ModelHandler):
    """ Actual volume handlers are supposed to inherit from this one. """

    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["name"]   = obj.storageobj.name
        data["megs"]   = obj.storageobj.megs
        data["host"]   = self._get_handler_instance(Host)._idobj(obj.volume.host)
        try:
            data["path"] = obj.volume.path
        except:
            pass
        data["status"] = obj.volume.status
        return data


class BlockVolumeHandler(ModelHandler):
    model = BlockVolume

    def _idobj(self, obj):
        if obj.volume is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._idobj(obj.volume)

    def _getobj(self, obj):
        if obj.volume is None:
            return ModelHandler._getobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._getobj(obj.volume)

    def remove(self, id):
        obj = self._get_model_manager().get(id=id)
        if obj.volume is None:
            return obj.delete()
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler.remove(obj.volume.id)

    def run_initscript(self, id, script):
        bv = BlockVolume.objects.get(id=id)
        return initscripts.run_initscript(bv, script)


class BlockVolumeProxy(ProxyModelHandler, BlockVolumeHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volume is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete volume" % (type(model), model.id))
            return None
        if model.volume.host == Host.objects.get_current():
            return None
        return model.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("BlockVolume.create is disabled, call volumes.VolumePool.create_volume instead.")

    def run_initscript(self, id, script):
        return self._call_singlepeer_method("run_initscript", id, script)


class AbstractFileSystemVolumeHandler(ModelHandler):
    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["name"]    = obj.storageobj.name
        data["megs"]    = obj.storageobj.megs
        data["host"]    = self._get_handler_instance(Host)._idobj(obj.volume.host)
        try:
            data["path"] = obj.volume.path
        except:
            pass
        data["mounted"] = obj.volume.fs.mounted
        data["usedmegs"]= obj.volume.fs.stat["used"]
        data["status"]  = obj.volume.status
        return data


class FileSystemVolumeHandler(ModelHandler):
    model = FileSystemVolume

    def _idobj(self, obj):
        if obj.volume is None:
            return ModelHandler._idobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._idobj(obj.volume)

    def _getobj(self, obj):
        if obj.volume is None:
            return ModelHandler._getobj(self, obj)
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler._getobj(obj.volume)

    def remove(self, id):
        obj = self._get_model_manager().get(id=id)
        if obj.volume is None:
            return obj.delete()
        handler = self._get_handler_instance(obj.volume.__class__)
        return handler.remove(obj.volume.id)

    def run_initscript(self, id, script):
        fsv = FileSystemVolume.objects.get(id=id)
        return initscripts.run_initscript(fsv, script)

class FileSystemVolumeProxy(ProxyModelHandler, FileSystemVolumeHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volume is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete volume" % (type(model), model.id))
            return None
        if model.volume.host == Host.objects.get_current():
            return None
        return model.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("FileSystemVolume.create is disabled, call volumes.VolumePool.create_volume instead.")

    def run_initscript(self, id, script):
        return self._call_singlepeer_method("run_initscript", id, script)


class GenericDiskHandler(AbstractBlockVolumeHandler):
    model = GenericDisk


class FileSystemProviderHandler(AbstractFileSystemVolumeHandler):
    model = FileSystemProvider

    def remove(self, id):
        return self._get_model_manager().get(id=id).base.volume.delete()

class FileSystemProviderProxy(ProxyModelHandler, FileSystemProviderHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.base.volume is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete base volume" % (type(model), model.id))
            return None
        if model.base.volume.host == Host.objects.get_current():
            return None
        return model.base.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("FileSystemProvider.create is disabled, call volumes.VolumePool.create_volume instead.")

    def remove(self, id):
        return self._call_singlepeer_method("remove", id)



class StorageObjectHandler(ModelHandler):
    model = StorageObject

    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)

        try:
            obj.volumepool
        except VolumePool.DoesNotExist:
            data["volumepool"] = None
        else:
            handler = self._get_handler_instance(obj.volumepool.__class__)
            data["volumepool"] = handler._getobj(obj.volumepool)

        try:
            obj.blockvolume
        except BlockVolume.DoesNotExist:
            data["blockvolume"] = None
        else:
            handler = self._get_handler_instance(obj.blockvolume.__class__)
            data["blockvolume"] = handler._getobj(obj.blockvolume)

        try:
            obj.filesystemvolume
        except FileSystemVolume.DoesNotExist:
            data["filesystemvolume"] = None
        else:
            handler = self._get_handler_instance(obj.filesystemvolume.__class__)
            data["filesystemvolume"] = handler._getobj(obj.filesystemvolume)

        return data


class StorageObjectProxy(ProxyModelHandler, StorageObjectHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.host == Host.objects.get_current():
            return None
        return model.host.peerhost_set.all()[0]

    def create(self, data):
        return self.backing_handler.create(data)


class InitScriptHandler(BaseHandler):
    handler_name = "volumes.InitScript"

    def get_initscripts(self):
        return initscripts.get_initscripts()

    def get_initscript_info(self, script):
        return initscripts.get_initscript_info(script)



RPCD_HANDLERS = [
    GenericDiskHandler,
    VolumePoolProxy,
    BlockVolumeProxy,
    FileSystemVolumeProxy,
    FileSystemProviderProxy,
    InitScriptHandler,
    StorageObjectProxy,
    ]
