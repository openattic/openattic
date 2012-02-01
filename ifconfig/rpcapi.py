# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from ifconfig.models import IPAddress, NetDevice

class IPAddressHandler(ModelHandler):
    model = IPAddress

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'address': obj.address}

class NetDeviceHandler(ModelHandler):
    model = NetDevice

    def _override_get(self, obj, data):
        data["basedevs"]  = [ self._idobj(base) for base in obj.basedevs ]
        data["childdevs"] = [ self._idobj(chld) for chld in obj.childdevs ]
        data["devtype"]   = obj.devtype
        data["operstate"] = obj.operstate
        data["speed"]     = obj.speed
        return data

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'devname': obj.devname}

    def write_interfaces(self):
        """ Update /etc/network/interfaces. """
        return NetDevice.write_interfaces()

RPCD_HANDLERS = [NetDeviceHandler, IPAddressHandler]
