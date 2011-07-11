# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler
from django.contrib.auth.models import User

from lvm.models import VolumeGroup, LogicalVolume, LVChainedModule

class UserHandler(BaseHandler):
    model = User
    exclude = ["password"]

class VgHandler(BaseHandler):
    model = VolumeGroup

class LvHandler(BaseHandler):
    model = LogicalVolume

    def _override_get(self, obj, data):
        if obj.filesystem:
            data['fs'] = {
                'info':  obj.fs.info,
                'stat':  obj.fs.stat,
                'mount': obj.fs.mountpoints,
                }
        else:
            data['fs'] = None
        data['lvm_info'] = obj.lvm_info
        return data

RPCD_HANDLERS = [VgHandler, LvHandler]
