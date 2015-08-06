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

from django.db import models
from django.contrib.contenttypes.models import ContentType

from ifconfig.models import Host, HostDependentManager
from volumes         import blockdevices
from volumes.models  import BlockVolume

class Array(BlockVolume):
    host        = models.ForeignKey(Host)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    @property
    def path(self):
        return "/dev/" + self.storageobj.name

    @property
    def member_set(self):
        return self.storageobj.base_set.all()

    def get_storage_devices(self):
        return [bv.volume for bv in BlockVolume.objects.filter(storageobj__in=self.member_set).order_by("storageobj__name")]

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        with open("/proc/mdstat") as fd:
            for line in fd:
                if line.startswith(self.storageobj.name):
                    if "(F)" in line:
                        return "degraded"
                    return "online"

    def get_volume_usage(self, stats):
        return

    def get_status(self):
        with open("/proc/mdstat") as fd:
            for line in fd:
                if line.startswith(self.storageobj.name):
                    if "(F)" in line:
                        return ["degraded"]
                    else:
                        return ["online"]

    @property
    def raid_params(self):
        chunksize = int(open("/sys/class/block/%s/md/chunk_size" % self.storageobj.name, "r").read().strip())
        raiddisks = int(open("/sys/class/block/%s/md/raid_disks" % self.storageobj.name, "r").read().strip())
        raidlevel = int(open("/sys/class/block/%s/md/level" % self.storageobj.name, "r").read().strip()[4:])
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

    def __unicode__(self):
        return "%s RAID-%d" % (self.storageobj.name, self.raid_params["raidlevel"])
