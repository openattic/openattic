# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from ifconfig.models import NetDevice

class NetDeviceHandler(BaseHandler):
    model = NetDevice

    def write_interfaces(self):
        return NetDevice.write_interfaces()

RPCD_HANDLERS = [NetDeviceHandler]
