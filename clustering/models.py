# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.conf import settings
from django.db import models

from lvm.models import StatefulModel
from drbd.models import DrbdDevice
from peering.models import PeerHost

class ServiceIP4(StatefulModel):
    address     = models.IPAddressField()
    peerhost    = models.ForeignKey(PeerHost, help_text='The host with which this address is shared.')
    resname     = models.CharField(max_length=100, default="service_ip")
    init_master = models.BooleanField(default=True)

    def save(self):
        if self.state != 'active':
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

            self.state = 'active'
            StatefulModel.save(self, ignore_state=True)



#class DrbdResource(models.Model):
    #device      = models.ForeignKey( DrbdDevice )
