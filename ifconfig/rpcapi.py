# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from ifconfig.models import IPAddress, NetDevice

class IPAddressHandler(ModelHandler):
    model = IPAddress

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'address': obj.address}

    def _override_get(self, obj, data):
        data["editable"]  = obj.configure and not obj.is_loopback
        return data

class NetDeviceHandler(ModelHandler):
    model = NetDevice

    def _override_get(self, obj, data):
        data["basedevs"]  = [ self._idobj(base) for base in obj.basedevs ]
        data["childdevs"] = [ self._idobj(chld) for chld in obj.childdevs ]
        data["devtype"]   = obj.devtype
        data["operstate"] = obj.operstate
        data["speed"]     = obj.speed
        data["carrier"]   = obj.carrier
        data["mtu"]       = obj.mtu
        data["macaddress"]= obj.macaddress
        return data

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {
            'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name,
            'devname': obj.devname,
            'devtype': obj.devtype
            }

    def get_root_devices(self):
        """ Get devices that are considered a root device. """
        return [self._getobj(obj) for obj in NetDevice.get_root_devices()]

    def write_interfaces(self):
        """ Update /etc/network/interfaces. """
        return NetDevice.write_interfaces()

RPCD_HANDLERS = [NetDeviceHandler, IPAddressHandler]
