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

from django.db import models

from systemd import get_dbus_object
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices
from volumes.models import DeviceNotFound, BlockVolume, CapabilitiesAwareManager


class Controller(models.Model):
    host        = models.ForeignKey(Host)
    index       = models.IntegerField()
    bbustate    = models.CharField(max_length=150, blank=True)
    model       = models.CharField(max_length=150, blank=True)
    serial      = models.CharField(max_length=150, blank=True)
    actdrives   = models.IntegerField()
    curdrives   = models.IntegerField()
    maxdrives   = models.IntegerField()
    actunits    = models.IntegerField()
    curunits    = models.IntegerField()
    maxunits    = models.IntegerField()
    autorebuild = models.BooleanField()

    objects     = HostDependentManager()
    all_objects = models.Manager()


class Enclosure(models.Model):
    index       = models.IntegerField()
    controller  = models.ForeignKey(Controller)
    alarms      = models.IntegerField(default=0)
    slots       = models.IntegerField(default=0)
    fans        = models.IntegerField(default=0)
    tsunits     = models.IntegerField(default=0)
    psunits     = models.IntegerField(default=0)

    objects     = getHostDependentManagerClass("controller__host")()
    all_objects = models.Manager()



class Unit(BlockVolume):
    index       = models.IntegerField()
    name        = models.CharField(max_length=150, blank=True)
    serial      = models.CharField(max_length=150, blank=True)
    controller  = models.ForeignKey(Controller)
    unittype    = models.CharField(max_length=150, blank=True)
    status      = models.CharField(max_length=150, blank=True)
    rebuild     = models.IntegerField(blank=True, null=True)
    verify      = models.IntegerField(blank=True, null=True)
    chunksize   = models.IntegerField(blank=True, null=True)
    megs        = models.IntegerField()
    autoverify  = models.BooleanField()
    rdcache     = models.CharField(max_length=150, blank=True)
    wrcache     = models.CharField(max_length=150, blank=True)

    objects     = getHostDependentManagerClass("controller__host")()
    all_objects = CapabilitiesAwareManager()

    @property
    def host(self):
        return self.controller.host

    @property
    def path(self):
        import pyudev
        ctx = pyudev.Context()

        for dev in ctx.list_devices():
            if dev.subsystem != "block":
                continue
            if "ID_SCSI_SERIAL" in dev and dev["ID_SCSI_SERIAL"] == self.serial:
                return dev.device_node

        raise DeviceNotFound(self.serial)

    @property
    def type(self):
        return self.unittype

    @property
    def raid_params(self):
        raiddisks = self.disk_set.count()
        if self.unittype == "RAID-0":
            datadisks = raiddisks
        elif self.unittype in ("RAID-1", "SINGLE"):
            datadisks = 1
        elif self.unittype == "RAID-5":
            datadisks = raiddisks - 1
        elif self.unittype == "RAID-6":
            datadisks = raiddisks - 2
        elif self.unittype == "RAID-10":
            datadisks = raiddisks / 2
        else:
            raise blockdevices.UnsupportedRAIDLevel(raidlevel)
        return {
            "chunksize": self.chunksize,
            "raiddisks": raiddisks,
            "raidlevel": int(self.unittype[5:]) if self.unittype != "SINGLE" else 0,
            "datadisks": datadisks,
            "stripewidth": self.chunksize * datadisks
            }

    def __unicode__(self):
        if self.name:
            return self.name
        return "Unnamed Unit (/c%d/u%d)" % (self.controller.index, self.index)

class Disk(models.Model):
    controller  = models.ForeignKey(Controller)
    port        = models.IntegerField()
    disktype    = models.CharField(max_length=150)
    encl        = models.ForeignKey(Enclosure)
    enclslot    = models.IntegerField()
    megs        = models.IntegerField()
    model       = models.CharField(max_length=150)
    unit        = models.ForeignKey(Unit, blank=True, null=True)
    unitindex   = models.IntegerField(blank=True, null=True)
    serial      = models.CharField(max_length=150, blank=True)
    rpm         = models.IntegerField()
    status      = models.CharField(max_length=150, blank=True)
    temp_c      = models.IntegerField()
    linkspeed   = models.CharField(max_length=150, blank=True)
    power_on_h  = models.IntegerField()

    objects     = getHostDependentManagerClass("controller__host")()
    all_objects = models.Manager()

    def set_identify(self, state):
        get_dbus_object("/twraid").set_identify("/c%d/p%d" % (self.controller.index, self.port), state)

