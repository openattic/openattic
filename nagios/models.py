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

import os
import dbus
import re

from os.path import exists

from django.conf      import settings
from django.db        import models
from django.db.models import signals
from django.db.models import Q
from django.utils.translation   import ugettext_lazy as _
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

from lvm.models import LogicalVolume
from ifconfig.models import Host, IPAddress, HostDependentManager

from nagios.conf import settings as nagios_settings
from nagios.readstatus import NagiosState
from nagios.graphbuilder import RRD


class Command(models.Model):
    name        = models.CharField(max_length=250, unique=True)
    query_only  = models.BooleanField(default=False, help_text=_("Check this if openATTIC should not configure services with this command, only query those that exist."))

    def __unicode__(self):
        return self.name


class Graph(models.Model):
    command     = models.ForeignKey(Command)
    title       = models.CharField(max_length=250, unique=True)
    verttitle   = models.CharField(max_length=250, blank=True)
    fields      = models.CharField(max_length=500)

    def __unicode__(self):
        return "%s: %s" % (self.command.name, self.title)


class ServiceManager(HostDependentManager):
    def get_query_set(self):
        """ Return services that are either associated with this host directly,
            or with a volume in a group associated with this host.
        """
        return self.services_for_host(Host.objects.get_current())

    def services_for_host(self, host):
        """ Return services configured on a specific host. """
        return models.Manager.get_query_set(self).filter(
            Q(host=host, volume=None) |
            Q(host=None, volume__in=LogicalVolume.all_objects.filter(vg__host=host)))


class Service(models.Model):
    host        = models.ForeignKey(Host, blank=True, null=True)
    volume      = models.ForeignKey(LogicalVolume, blank=True, null=True)
    target_type = models.ForeignKey(ContentType, blank=True, null=True)
    target_id   = models.PositiveIntegerField(blank=True, null=True)
    target      = generic.GenericForeignKey("target_type", "target_id")
    description = models.CharField(max_length=250)
    command     = models.ForeignKey(Command)
    arguments   = models.CharField(max_length=500, blank=True)

    nagstate    = NagiosState()
    objects     = ServiceManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = ("host", "description")

    @classmethod
    def write_contacts(cls):
        nag = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios")
        nag.write_contacts()
        nag.restart()

    @classmethod
    def write_conf(cls):
        nag = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios")
        nag.write_services()
        nag.restart()

    @property
    def state(self):
        if self.hostname in Service.nagstate.servicemap and self.description in Service.nagstate.servicemap[self.hostname]:
            return Service.nagstate.servicemap[self.hostname][self.description]
        raise KeyError("The status for this service could not be found in Nagios's status cache.")

    @property
    def perfdata(self):
        """ Get current performance data. """
        return [ pv.split('=', 1) for pv in self.state["performance_data"].split() ]

    def __unicode__(self):
        return self.description

    @property
    def active(self):
        """ Return True if the service is active on this host. """
        return (self.host or self.volume.vg.host) == Host.objects.get_current()

    @property
    def hostname(self):
        """ Return the host name under which this service is configured in the Nagios config. """
        if self.command.query_only:
            return "localhost"
        return (self.host or self.volume.vg.host).name

    @property
    def rrd(self):
        servname = re.sub('[^\w\d_-]', '_', self.description).encode("UTF-8")
        xmlpath = nagios_settings.XML_PATH % {
            'host': self.hostname,
            'serv': servname
            }
        if not exists(xmlpath):
            raise SystemError("XML file not found")

        return RRD(xmlpath)


def create_service_for_lv(**kwargs):
    lv = kwargs["instance"]

    cmd = Command.objects.get(name=nagios_settings.LV_UTIL_CHECK_CMD)
    if lv.filesystem:
        if Service.objects.filter(command=cmd, volume=lv).count() == 0:
            serv = Service(
                host        = None,
                volume      = lv,
                command     = cmd,
                description = nagios_settings.LV_UTIL_DESCRIPTION % lv.name,
                arguments   = "%d%%!%d%%!%s" % (100 - lv.fswarning, 100 - lv.fscritical, lv.mountpoint)
                )
            serv.save()
        else:
            # update the arguments because warn/crit may have changed
            serv = Service.objects.get(command=cmd, volume=lv, arguments__endswith=lv.mountpoint)
            serv.arguments = "%d%%!%d%%!%s" % (100 - lv.fswarning, 100 - lv.fscritical, lv.mountpoint)
            serv.save()

    cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
    if Service.objects.filter(command=cmd, volume=lv).count() == 0:
        serv = Service(
            host        = None,
            volume      = lv,
            command     = cmd,
            description = nagios_settings.LV_PERF_DESCRIPTION % lv.name,
            arguments   = lv.device
            )
        serv.save()

    if lv.snapshot:
        cmd = Command.objects.get(name=nagios_settings.LV_SNAP_CHECK_CMD)
        if Service.objects.filter(command=cmd, volume=lv).count() == 0:
            serv = Service(
                host        = None,
                volume      = lv,
                command     = cmd,
                description = nagios_settings.LV_SNAP_DESCRIPTION % lv.name,
                arguments   = lv.name
                )
            serv.save()

    if "OACONFIG" not in os.environ:
        Service.write_conf()


def delete_service_for_lv(**kwargs):
    lv = kwargs["instance"]
    for serv in Service.objects.filter(volume=lv):
        serv.delete()

    Service.write_conf()


def update_contacts(**kwargs):
    nag = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios")
    nag.write_contacts()
    nag.restart()


def create_service_for_ip(**kwargs):
    ip = kwargs["instance"]
    if not ip.is_loopback:
        try:
            cmd = Command.objects.get(name=nagios_settings.TRAFFIC_CHECK_CMD)
        except Command.DoesNotExist:
            # fails during initial installation, when the ifconfig module does its iface
            # recognition before my fixtures have been loaded.
            pass
        else:
            if ip.device is not None and Service.objects.filter(command=cmd, arguments=ip.device.devname).count() == 0:
                serv = Service(
                    host        = Host.objects.get_current(),
                    volume      = None,
                    command     = cmd,
                    description = nagios_settings.TRAFFIC_DESCRIPTION % ip.device.devname,
                    arguments   = ip.device.devname
                    )
                serv.save()

    if "OACONFIG" not in os.environ:
        Service.write_conf()


def delete_service_for_ip(**kwargs):
    ip = kwargs["instance"]
    cmd = Command.objects.get(name=nagios_settings.TRAFFIC_CHECK_CMD)
    for serv in Service.objects.filter(command=cmd, arguments=ip.device.devname):
        serv.delete()

    Service.write_conf()


signals.post_save.connect(  create_service_for_lv, sender=LogicalVolume )
signals.pre_delete.connect( delete_service_for_lv, sender=LogicalVolume )

signals.post_save.connect(   update_contacts, sender=User )
signals.post_delete.connect( update_contacts, sender=User )

signals.post_save.connect(  create_service_for_ip, sender=IPAddress )
signals.pre_delete.connect( delete_service_for_ip, sender=IPAddress )
