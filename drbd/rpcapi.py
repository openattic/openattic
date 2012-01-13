# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from drbd.models import DrbdDevice

class DrbdDeviceHandler(ModelHandler):
    model = DrbdDevice

    def _override_get(self, obj, data):
        data['path']    = obj.path
        data['basedev'] = obj.basedev
        data['cstate']  = obj.cstate
        data['dstate']  = obj.dstate
        data['role']    = obj.role
        return data

    def primary(self, id):
        """ Switch the DRBD resource given by `id` to the Primary role on this host. """
        dev = DrbdDevice.objects.get(id=id)
        return dev.primary()

RPCD_HANDLERS = [DrbdDeviceHandler]
