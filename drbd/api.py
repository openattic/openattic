# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from piston.handler import BaseHandler
from drbd.models import DrbdDevice

class DrbdDeviceHandler(BaseHandler):
    allowed_methods = ('GET',)
    model   = DrbdDevice
    fields  = ("id", "peeraddress", "selfaddress", "volume", "path", "basedev", "peerhost",
               "res", "cstate", "dstate", "role", "state", "resname", "init_master", "protocol",
               "wfc_timeout", "degr_wfc_timeout", "outdated_wfc_timeout", "on_io_error", "fencing",
               "cram_hmac_alg", "sb_0pri", "sb_1pri", "sb_2pri", "syncer_rate", "format_policy")

    @staticmethod
    def resource_uri():
        return ('api_drbd_device_handler', ['id'])

api_handlers = [
    ( (r'drbd/devs/(?P<id>\w+)/', r'drbd/devs/'), DrbdDeviceHandler, 'api_drbd_device_handler' ),
    ]
