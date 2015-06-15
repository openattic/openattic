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
from django.db.models import signals
from django.conf import settings
from django.contrib.contenttypes.models import ContentType

from systemd import get_dbus_object
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices
from volumes.models import DeviceNotFound, BlockVolume, CapabilitiesAwareManager, PhysicalBlockDevice

if "nagios" in settings.INSTALLED_APPS:
    HAVE_NAGIOS = True
    from nagios.models import Command, Service
    from nagios.conf import settings as nagios_settings
else:
    HAVE_NAGIOS = False



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
    autorebuild = models.BooleanField(default=False)

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
    serial      = models.CharField(max_length=150, blank=True)
    controller  = models.ForeignKey(Controller)
    unittype    = models.CharField(max_length=150, blank=True)
    status      = models.CharField(max_length=150, blank=True)
    rebuild     = models.IntegerField(blank=True, null=True)
    verify      = models.IntegerField(blank=True, null=True)
    chunksize   = models.IntegerField(blank=True, null=True)
    autoverify  = models.BooleanField(default=False)
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
            raise blockdevices.UnsupportedRAIDLevel(self.unittype)
        return {
            "chunksize": self.chunksize,
            "raiddisks": raiddisks,
            "raidlevel": int(self.unittype[5:]) if self.unittype != "SINGLE" else 0,
            "datadisks": datadisks,
            "stripewidth": self.chunksize * datadisks
            }

    def get_storage_devices(self):
        return self.disk_set.all().order_by("enclslot")

    def get_volume_usage(self, stats):
        return

    def get_status(self):
        if self.status == "OK":
            return ["online"]
        elif self.status:
            return [self.status.lower()]

    def __unicode__(self):
        if self.storageobj.name:
            return "%s (%s)" % (self.storageobj.name, self.unittype)
        return "Unnamed Unit (/c%d/u%d, %s)" % (self.controller.index, self.index, self.unittype)


if HAVE_NAGIOS:
    def __create_service_for_unit(instance, **kwargs):
        cmd = Command.objects.get(name=nagios_settings.TWRAID_UNIT_CHECK_CMD)
        ctype = ContentType.objects.get_for_model(instance.__class__)
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count() != 0:
            return
        # fuck you nagios
        desc = nagios_settings.TWRAID_UNIT_DESCRIPTION % unicode(instance)
        for illegalchar in """`~!$%^&*|'"<>?,()=""":
            desc = desc.replace(illegalchar, "")
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = desc,
            arguments   = instance.serial
        )
        srv.save()

    def __delete_service_for_unit(instance, **kwargs):
        ctype = ContentType.objects.get_for_model(instance.__class__)
        for srv in Service.objects.filter(target_type=ctype, target_id=instance.id):
            srv.delete()

    signals.post_save.connect(  __create_service_for_unit, sender=Unit)
    signals.post_delete.connect(__delete_service_for_unit, sender=Unit)



class Disk(PhysicalBlockDevice):
    controller  = models.ForeignKey(Controller)
    port        = models.IntegerField()
    type        = models.CharField(max_length=150)
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

    def get_status(self):
        if self.status == "OK":
            return ["online"]
        elif self.status:
            return [self.status.lower()]

    def __unicode__(self):
        return "%s %dk (Slot %d)" % (self.type, self.rpm / 1000, self.enclslot)
