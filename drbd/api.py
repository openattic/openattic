# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from piston.handler import BaseHandler
from drbd.models import DrbdDevice

class DrbdDeviceHandler(BaseHandler):
    allowed_methods = ('GET',)
    model   = DrbdDevice
    fields  = ("id", "peeraddress", "selfaddress", "volume", "path", "basedev", "peerhost",
               "res", "cstate", "dstate", "role" )

    @staticmethod
    def resource_uri():
        return ('api_drbd_device_handler', ['id'])

api_handlers = [
    ( (r'drbd/devs/(?P<id>\w+)/', r'drbd/devs/'), DrbdDeviceHandler, 'api_drbd_device_handler' ),
    ]
