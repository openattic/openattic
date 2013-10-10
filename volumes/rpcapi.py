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

class VolumePoolHandler(ModelHandler):
    model = VolumePool

class BlockVolumeHandler(ModelHandler):
    model = BlockVolume

class FileSystemVolumeHandler(ModelHandler):
    model = FileSystemVolume

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
    VolumePoolHandler,
    BlockVolumeHandler,
    FileSystemVolumeHandler,
    FileSystemProviderHandler,
    ]
