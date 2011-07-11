# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from drbd.models import DrbdDevice

class DrbdDeviceHandler(BaseHandler):
    model = DrbdDevice

RPCD_HANDLERS = [DrbdDeviceHandler]
