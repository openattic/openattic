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


class Service(models.Model):
    host        = models.ForeignKey(Host, blank=True, null=True)
    target_type = models.ForeignKey(ContentType, blank=True, null=True)
    target_id   = models.PositiveIntegerField(blank=True, null=True)
    target      = generic.GenericForeignKey("target_type", "target_id")
    description = models.CharField(max_length=250)
    command     = models.ForeignKey(Command)
    arguments   = models.CharField(max_length=500, blank=True)

    nagstate    = NagiosState()
    objects     = HostDependentManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = ("host", "description")

    @property
    def state(self):
        # Strip trailing space. Checks shouldn't ever be created as such, but if they
        # are, let's at least make sure this works.
        striphost = self.hostname.strip()
        stripdesc = self.description.strip()
        if striphost in Service.nagstate.servicemap and stripdesc in Service.nagstate.servicemap[striphost]:
            return Service.nagstate.servicemap[striphost][stripdesc]
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
        servname = re.sub('[^\w\d_-]', '_', self.description.strip()).encode("UTF-8")
        xmlpath = nagios_settings.XML_PATH % {
            'host': self.hostname,
            'serv': servname
            }
        if not exists(xmlpath):
            raise SystemError("XML file not found")

        return RRD(xmlpath)


def update_conf(**kwargs):
    nag = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios")
    nag.writeconf()


signals.post_save.connect(   update_conf, sender=User )
signals.post_delete.connect( update_conf, sender=User )

signals.post_save.connect(   update_conf, sender=Service )
signals.post_delete.connect( update_conf, sender=Service )
