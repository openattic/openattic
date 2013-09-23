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

from volumes.models import VolumePool, BlockVolume, FileSystemVolume
from ifconfig.models import Host

class VolumePoolHandler(ModelHandler):
    model = VolumePool

    def _override_get(self, obj, data):
        vpoolhandler = self._get_handler_instance(obj.volumepool.__class__)
        data["volumepool"] = vpoolhandler._idobj(obj.volumepool)
        return data

class BlockVolumeHandler(ModelHandler):
    model = BlockVolume

    def _override_get(self, obj, data):
        volumehandler = self._get_handler_instance(obj.volume.__class__)
        data["volume"] = volumehandler._idobj(obj.volume)
        return data

class FileSystemVolumeHandler(ModelHandler):
    model = FileSystemVolume

    def _override_get(self, obj, data):
        volumehandler = self._get_handler_instance(obj.volume.__class__)
        data["volume"] = volumehandler._idobj(obj.volume)
        hosthandler = self._get_handler_instance(Host)
        data['filesystem'] = obj.fsname
        data['fs'] = {
            'mountpoint':  obj.mountpoint,
            'mounted':     obj.mounted,
            'host':        hosthandler._idobj(obj.mounthost)
            }
        if obj.mounted:
            data['fs']['stat'] = obj.stat
        return data


RPCD_HANDLERS = [
    VolumePoolHandler,
    BlockVolumeHandler,
    FileSystemVolumeHandler,
    ]
