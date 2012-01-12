# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models

from ifconfig.models import IPAddress
from drbd.models     import DrbdDevice
from peering.models  import PeerHost

class ServiceIP4(models.Model):
    address     = models.ForeignKey(IPAddress)
    peerhost    = models.ForeignKey(PeerHost, help_text='The host with which this address is shared.')
    resname     = models.CharField(max_length=100, default="service_ip")
    init_master = models.BooleanField(default=True)
    initialized = models.BooleanField(default=False, editable=False)

    def clean_fields(self, exclude=None):
        if self.peerhost_id is not None:
            if not self.peerhost.clusterpeer:
                raise ValidationError('The given peer is not marked as being in a Pacemaker cluster with us.')
        else:
            try:
                self.peerhost = PeerHost.objects.get(clusterpeer=True)
            except PeerHost.DoesNotExist:
                raise ValidationError('There is no peer that is marked as being in a Pacemaker cluster with us.')
        return models.Model.clean_fields(self, exclude)

    def save(self):
        if not self.initialized:
            if self.init_master:
                thishost = {'app': 'peering', 'obj': 'PeerHost', 'id': self.peerhost.thishost['id']}
                self.peerhost.clustering.ServiceIP4.new({
                    'address':  self.address,
                    'peerhost': thishost,
                    'init_master': False
                    })

            if self.init_master:
                crm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/clustering")
                crm.resource_create_ip4( self.resname, self.address )

            self.initialized = True
            models.Model.save(self)



class DrbdResource(models.Model):
    device      = models.ForeignKey( DrbdDevice )
    init_master = models.BooleanField(default=True)
    initialized = models.BooleanField(default=False, editable=False)

    def clean_fields(self, exclude=None):
        if self.device_id is not None:
            if not self.device.peerhost.clusterpeer:
                raise ValidationError("The drbd Device's peer is not marked as being in a Pacemaker cluster with us.")
        return models.Model.clean_fields(self, exclude)

    def sollmalsavewerdenaberichgehjetztheim(self):
        if not self.initialized:
            if self.init_master:
                thishost = {'app': 'peering', 'obj': 'PeerHost', 'id': self.peerhost.thishost['id']}
                self.peerhost.clustering.DrbdResource.new({
                    'address':  self.address,
                    'peerhost': thishost,
                    'init_master': False
                    })

            if self.init_master:
                crm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/clustering")
                crm.resource_create_ip4( self.resname, self.address )

            self.initialized = True
            models.Model.save(self)
