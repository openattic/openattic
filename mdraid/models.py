# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import dbus

from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices
from volumes.models import DeviceNotFound, BlockVolume, CapabilitiesAwareManager

class Array(BlockVolume):
    name        = models.CharField(max_length=50)
    megs        = models.IntegerField()
    host        = models.ForeignKey(Host)
    type        = models.CharField(max_length=50)

    @property
    def path(self):
        return "/dev/" + self.name

    @property
    def member_set(self):
        return BlockVolume.objects.filter(upper_type=ContentType.objects.get_for_model(self.__class__), upper_id=self.id)

    @property
    def status(self):
        with open("/proc/mdstat") as fd:
            for line in fd:
                if line.startswith(self.name):
                    if "(F)" in line:
                        return "degraded"
                    return "online"

    @property
    def raid_params(self):
        chunksize = int(open("/sys/class/block/%s/md/chunk_size" % self.name, "r").read().strip())
        raiddisks = int(open("/sys/class/block/%s/md/raid_disks" % self.name, "r").read().strip())
        raidlevel = int(open("/sys/class/block/%s/md/level" % self.name, "r").read().strip()[4:])
        if raidlevel == 0:
            datadisks = raiddisks
        elif raidlevel == 1:
            datadisks = 1
        elif raidlevel == 5:
            datadisks = raiddisks - 1
        elif raidlevel == 6:
            datadisks = raiddisks - 2
        elif raidlevel == 10:
            datadisks = raiddisks / 2
        else:
            raise blockdevices.UnsupportedRAIDLevel(raidlevel)
        stripewidth = chunksize * datadisks
        return {
            "chunksize": chunksize,
            "raiddisks": raiddisks,
            "raidlevel": raidlevel,
            "datadisks": datadisks,
            "stripewidth": stripewidth,
            }


