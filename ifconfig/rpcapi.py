# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

from django.db   import models

from systemd import get_dbus_object
from rpcd.handlers import ModelHandler

from ifconfig.models import HostGroup, Host, IPAddress, NetDevice


class HostGroupHandler(ModelHandler):
    model = HostGroup

class HostHandler(ModelHandler):
    model = Host

    def current(self):
        return self._getobj(Host.objects.get_current())

    def current_id(self):
        return self._idobj(Host.objects.get_current())

    def get_lowest_primary_ip_address_speed(self, peer_id):
        speed_peer = Host.objects.get(id=peer_id).get_primary_ip_address_speed()
        speed_self = Host.objects.get(id=Host.objects.get_current().id).get_primary_ip_address_speed()

        if(speed_self <= speed_peer):
            return speed_self
        else:
            return speed_peer

class IPAddressHandler(ModelHandler):
    model = IPAddress

    def _get_model_manager(self):
        return self.model.all_objects

    def _override_get(self, obj, data):
        data["editable"]  = obj.configure and not obj.is_loopback
        return data

    def get_valid_ips(self, idobj):
        model = models.get_model(idobj["app"], idobj["obj"])
        handler = self._get_handler_instance(model)
        targethost = handler._find_target_host(idobj["id"])
        if targethost is None:
            return [ self._idobj(ip) for ip in
                IPAddress.objects.all()
                if not ip.is_loopback ]
        return [ self._idobj(ip) for ip in
            IPAddress.all_objects.filter(device__host__name=targethost.name)
            if not ip.is_loopback ]


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
        data["macaddress"] = obj.macaddress
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

    def validate_config(self):
        """ Check if the current configuration is valid. """
        return NetDevice.validate_config()

    def activate_config(self):
        """ Stop networking, update /etc/network/interfaces and start up the new configuration. """
        ifc = get_dbus_object("/ifconfig")
        NetDevice.validate_config()
        ifc.ifdown()
        NetDevice.write_interfaces()
        ifc.ifup()
        return True

    def in_use(self, id):
        """ Determine whether or not the device with the given ID is configured with any services. """
        return NetDevice.objects.get(id=id).in_use

RPCD_HANDLERS = [HostGroupHandler, HostHandler, NetDeviceHandler, IPAddressHandler]
