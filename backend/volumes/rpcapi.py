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
from volumes.filesystems import FILESYSTEMS
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
    """ Handler class that Handlers for concrete VolumePool implementation
        classes are supposed to inherit from.

        Ensures a basic amount of information is provided.
    """
    order = ("storageobj__name",)

    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["usedmegs"] = obj.volumepool.usedmegs
        data["status"]   = obj.volumepool.status
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
            "megs":      obj.storageobj.megs,
            "usedmegs":  obj.volumepool.usedmegs,
            "type":      obj.volumepool_type,
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
        handler = self._get_handler_instance(ContentType)
        return {
            "status":    obj.volumepool.status,
            "megs":      obj.storageobj.megs,
            "usedmegs":  obj.volumepool.usedmegs,
            "type":      handler._idobj(obj.volumepool_type),
        }

    def create_volume(self, id, name, megs, options):
        """ Create a volume in this pool.

            Options include:
             * filesystem: The filesystem the volume is supposed to have (if any).
             * owner:      The owner of the file system.
             * fswarning:  Warning Threshold for Nagios checks.
             * fscritical: Critical Threshold for Nagios checks.
        """
        obj = VolumePool.objects.get(id=id)
        if "owner" in options:
            options["owner"] = ModelHandler._get_object_by_id_dict(options["owner"])
        vol = obj.volumepool.create_volume(name, megs, options)
        handler = self._get_handler_instance(vol.__class__)
        return handler._idobj(vol)

    def get_supported_filesystems(self, id):
        """ Return filesystems supported by a given Volume Pool. """
        obj = VolumePool.objects.get(id=id)
        return [{"name": fs.name} for fs in obj.volumepool.get_supported_filesystems()]

class VolumePoolProxy(ProxyModelHandler, VolumePoolHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volumepool is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete volumepool" % (type(model), model.id))
            return None
        if model.volumepool.host in (None, Host.objects.get_current()):
            return None
        return model.volumepool.host.peerhost_set.all()[0]

    def get_status(self, id):
        return self._call_singlepeer_method("get_status", id)

    def get_supported_filesystems(self, id):
        return self._call_singlepeer_method("get_supported_filesystems", id)

    def get_sufficient(self, host_id, min_megs):
        """ Find a volumepool that has sufficient free space for a new volume to be created. """
        volumepools = VolumePool.all_objects.all()
        host = Host.objects.get(id=host_id)
        result_pools = []
        for volumepool in volumepools:
            if volumepool.volumepool.host == host:
                status = self.get_status(volumepool.id)
                if status["megs"] is not None and status["usedmegs"] is not None:
                    free_megs = status["megs"] - status["usedmegs"]
                    if free_megs >= float(min_megs):
                        result_pools.append(self.get(volumepool.id))
        return result_pools

    def create_volume(self, id, name, megs, options):
        """ Create a volume in this pool.

            Options include:
             * filesystem: The filesystem the volume is supposed to have (if any).
             * owner:      The owner of the file system.
             * fswarning:  Warning Threshold for Nagios checks.
             * fscritical: Critical Threshold for Nagios checks.
        """
        return self._call_singlepeer_method("create_volume", id, name, megs, options)


class AbstractBlockVolumeHandler(ModelHandler):
    """ Handler class that Handlers for concrete BlockVolume implementation
        classes are supposed to inherit from.

        Ensures a basic amount of information is provided.
    """
    order = ("storageobj__name",)

    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["name"]   = obj.storageobj.name
        data["megs"]   = obj.storageobj.megs
        if obj.volume.host is not None:
            data["host"] = self._get_handler_instance(Host)._idobj(obj.volume.host)
        else:
            data["host"] = None
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
        if model.volume.host in (None, Host.objects.get_current()):
            return None
        return model.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("BlockVolume.create is disabled, call volumes.VolumePool.create_volume instead.")

    def run_initscript(self, id, script):
        return self._call_singlepeer_method("run_initscript", id, script)


class AbstractFileSystemVolumeHandler(ModelHandler):
    """ Handler class that Handlers for concrete FileSystemVolume implementation
        classes are supposed to inherit from.

        Ensures a basic amount of information is provided.
    """
    def _getobj(self, obj):
        data = ModelHandler._getobj(self, obj)
        data["name"]    = obj.storageobj.name
        data["megs"]    = obj.storageobj.megs
        if obj.volume.host is not None:
            data["host"] = self._get_handler_instance(Host)._idobj(obj.volume.host)
        else:
            data["host"] = None
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

    def mount(self, id):
        return FileSystemVolume.objects.get(id=id).mount()

    def unmount(self, id):
        return FileSystemVolume.objects.get(id=id).unmount()

class FileSystemVolumeProxy(ProxyModelHandler, FileSystemVolumeHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.volume is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete volume" % (type(model), model.id))
            return None
        if model.volume.host in (None, Host.objects.get_current()):
            return None
        return model.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("FileSystemVolume.create is disabled, call volumes.VolumePool.create_volume instead.")

    def run_initscript(self, id, script):
        return self._call_singlepeer_method("run_initscript", id, script)

    def mount(self, id):
        """ Mount a file system. """
        return self._call_singlepeer_method("mount", id)

    def unmount(self, id):
        """ Unmount a file system. """
        return self._call_singlepeer_method("unmount", id)


class GenericDiskHandler(AbstractBlockVolumeHandler):
    model = GenericDisk


class FileSystemProviderHandler(AbstractFileSystemVolumeHandler):
    model = FileSystemProvider

    def remove(self, id):
        return self._get_model_manager().get(id=id).base.volume.delete()

    def get_installed_filesystems(self):
        return [{"name": fs.name} for fs in FILESYSTEMS]

class FileSystemProviderProxy(ProxyModelHandler, FileSystemProviderHandler):
    def _find_target_host_from_model_instance(self, model):
        if model.base.volume is None:
            logging.error("Got None when querying model '%s' instance '%s' for its concrete base volume" % (type(model), model.id))
            return None
        if model.base.volume.host in (None, Host.objects.get_current()):
            return None
        return model.base.volume.host.peerhost_set.all()[0]

    def create(self, data):
        raise NotImplementedError("FileSystemProvider.create is disabled, call volumes.VolumePool.create_volume instead.")

    def remove(self, id):
        return self._call_singlepeer_method("remove", id)



class StorageObjectHandler(ModelHandler):
    model = StorageObject
    order = ("name",)

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

    def _idobj(self, obj):
        data = ModelHandler._idobj(self, obj)

        try:
            obj.volumepool
        except VolumePool.DoesNotExist:
            data["volumepool"] = None
        else:
            handler = self._get_handler_instance(obj.volumepool.__class__)
            data["volumepool"] = handler._idobj(obj.volumepool)

        try:
            obj.blockvolume
        except BlockVolume.DoesNotExist:
            data["blockvolume"] = None
        else:
            handler = self._get_handler_instance(obj.blockvolume.__class__)
            data["blockvolume"] = handler._idobj(obj.blockvolume)

        try:
            obj.filesystemvolume
        except FileSystemVolume.DoesNotExist:
            data["filesystemvolume"] = None
        else:
            handler = self._get_handler_instance(obj.filesystemvolume.__class__)
            data["filesystemvolume"] = handler._idobj(obj.filesystemvolume)

        return data

    def resize(self, id, newmegs):
        """ Resize this object to the new size. """
        return StorageObject.objects.get(id=id).resize(newmegs)

    def create_volume(self, id, name, megs, options):
        obj = StorageObject.objects.get(id=id)
        if "owner" in options:
            options["owner"] = ModelHandler._get_object_by_id_dict(options["owner"])
        vol = obj.create_volume(name, megs, options)
        return self._idobj(vol)

    def create_filesystem(self, id, fstype, options):
        obj = StorageObject.objects.get(id=id)
        if "owner" in options:
            options["owner"] = ModelHandler._get_object_by_id_dict(options["owner"])
        return self._idobj(obj.create_filesystem(fstype, options))

    def create_snapshot(self, id, name, megs, options):
        return self._idobj(StorageObject.objects.get(id=id).create_snapshot(name, megs, options))

    def clone(self, id, target_id, options):
        target = None
        if int(target_id):
            target = StorageObject.objects.get(id=int(target_id))
        return self._idobj(StorageObject.objects.get(id=id).clone(target, options))

    def wait(self, id, max_wait):
        """ Wait until the StorageObject's lock has been released.

            If the StorageObject in question is not currently locked,
            wait() will return True instantly.

            If max_wait is 0, wait() will return instantly.

            If the lock has not been released during the given
            time period, wait() will return False; True otherwise.
        """
        return StorageObject.objects.get(id=id).wait(int(max_wait))

class StorageObjectProxy(ProxyModelHandler, StorageObjectHandler):
    def _find_target_host_from_model_instance(self, model):
        try:
            if model.host in (None, Host.objects.get_current()):
                return None
            return model.host.peerhost_set.all()[0]
        except ValueError:
            return None

    def create(self, data):
        return self.backing_handler.create(data)

    def remove(self, id):
        try:
            ProxyModelHandler.remove(self, id)
        except ValueError:
            # no authoritative object found -> delete database entry directly
            self.backing_handler.remove(id)

    def resize(self, id, newmegs):
        return self._call_singlepeer_method("resize", id, newmegs)

    def create_volume(self, id, name, megs, options):
        """ Create a volume in this pool.

            Options include:
             * filesystem: The filesystem the volume is supposed to have (if any).
             * owner:      The owner of the file system.
             * fswarning:  Warning Threshold for Nagios checks.
             * fscritical: Critical Threshold for Nagios checks.

            What exactly this means is up to the volume implementation.
        """
        return self._call_singlepeer_method("create_volume", id, name, megs, options)

    def create_filesystem(self, id, fstype, options):
        """ Create a filesystem on this blockvolume.

            Options include:
             * owner:      The owner of the file system.
             * fswarning:  Warning Threshold for Nagios checks.
             * fscritical: Critical Threshold for Nagios checks.

            What exactly this means is up to the file system implementation.
        """
        return self._call_singlepeer_method("create_filesystem", id, fstype, options)

    def create_snapshot(self, id, name, megs, options):
        """ Create a snapshot of this volume and return its StorageObject.

            What exactly this means is up to the volume implementation.
        """
        return self._call_singlepeer_method("create_snapshot", id, name, megs, options)

    def clone(self, id, target_id, options):
        """ Clone the given volume into the target.

            The target need not exist: If you pass 0 as the target_id and
            the `name' option in the options dict, a new volume will be
            created if possible before cloning takes place.
        """
        return self._call_singlepeer_method("clone", id, target_id, options)

    def wait(self, id, max_wait):
        """ Wait until the StorageObject's lock has been released.

            If the StorageObject in question is not currently locked,
            wait() will return True instantly.

            If max_wait is 0, wait() will return instantly.

            If the lock has not been released during the given
            time period, wait() will return False; True otherwise.
        """
        return self._call_singlepeer_method("wait", id, max_wait)


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
