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

from django.core.exceptions import ValidationError
from django.db import models

from systemd import get_dbus_object
from ifconfig.models import IPAddress
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
                crm = get_dbus_object("/clustering")
                crm.resource_create_ip4( self.resname, self.address )

            self.initialized = True
            models.Model.save(self)
