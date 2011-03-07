# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume, LVChainedModule
from peering.models import PeerHost

from drbd.procutils import drbd_cstate, drbd_dstate, drbd_role

class DrbdDevice(LVChainedModule):
    peerhost    = models.ForeignKey(PeerHost)
    selfaddress = models.CharField(max_length=250)
    peeraddress = models.CharField(max_length=250)

    @property
    def res(self):
        return "r%d" % self.id

    @property
    def path(self):
        return "/dev/drbd%d" % self.id

    @property
    def cstate(self):
        return drbd_cstate(self.res)

    @property
    def dstate(self):
        return drbd_dstate(self.res).split('/')

    @property
    def role(self):
        return drbd_role(self.res)

    @property
    def peerdevice(self):
        """ The counterpart device on our peer, if any. """
        alldevs = self.peerhost.getjson("/api/drbd/devs/")
        for dev in alldevs:
            if dev['peeraddress'] == self.selfaddress and dev['selfaddress'] == self.peeraddress:
                return dev
        return None
