# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume, LVChainedModule

class DrbdDevice(LVChainedModule):
    selfaddress = models.CharField(max_length=250)
    peeraddress = models.CharField(max_length=250)
    peername    = models.CharField(max_length=250)

    @property
    def path(self):
        return "/dev/drbd%d" % self.id
