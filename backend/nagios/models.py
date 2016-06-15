# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
import re

from datetime import datetime
from os.path import exists

from django.db        import models
from django.db.models import signals
from django.db.models import Q
from django.utils.translation   import ugettext_lazy as _
from django.utils.timezone import make_aware, get_default_timezone
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

from systemd import get_dbus_object
from systemd.helpers import Transaction
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
    arguments   = models.CharField(max_length=500, blank=True, default='')

    nagstate    = NagiosState(nagios_settings.STATUS_DAT_PATH)
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
        perfdata = self.state.get("performance_data", "").strip()
        if not perfdata:
            return {}
        # Fix for braindead check plugins that format the perfdata with their locale.
        # this is ugly as hell, but PNP does it the same way.
        perfdata = perfdata.replace(",", ".")
        data = {}
        for definition in perfdata.split(" "):
            if '=' not in definition:
                continue
            key, values = definition.split("=", 1)
            data[key] = dict(zip(
                ["curr", "warn", "crit", "min", "max"],
                [v for v in values.split(";") if v]))
            m = re.match( '^(?P<value>\d*(?:\.\d+)?)(?P<unit>[^\d]*)$', data[key]["curr"] )
            if m:
                data[key]["curr"] = float(m.group("value"))
                data[key]["unit"] = m.group("unit")
            for perfkey in data[key]:
                if perfkey != "unit":
                    data[key][perfkey] = float(data[key][perfkey])
        return data

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

    @property
    def last_check(self):
        try:
            tstamp = int(self.state["last_check"]) or self.rrd.last_check
        except (KeyError, SystemError):
            return None
        else:
            return make_aware(datetime.fromtimestamp(tstamp), get_default_timezone())

    @property
    def next_check(self):
        try:
            tstamp = int(self.state["next_check"])
        except KeyError:
            return None
        else:
            return make_aware(datetime.fromtimestamp(tstamp), get_default_timezone())

    @property
    def status(self):
        try:
            return {"0": "OK", "1": "Warning", "2": "Critical"}[self.state["current_state"]]
        except KeyError:
            return "Unknown"

def update_conf_for_user(instance, **kwargs):
    try:
        old_user = User.objects.get(id=instance.id)
    except User.DoesNotExist:
        old_user = None
    if old_user is None or instance.email != old_user.email:
        nagios = get_dbus_object("/nagios")
        with Transaction(background=False):
            nagios.writeconf()
            nagios.restart_service()

def update_conf(**kwargs):
    nagios = get_dbus_object("/nagios")
    with Transaction(background=False):
        nagios.writeconf()
        nagios.restart_service()


signals.pre_save.connect(    update_conf_for_user, sender=User )
signals.post_delete.connect( update_conf, sender=User )

signals.post_save.connect(   update_conf, sender=Service )
signals.post_delete.connect( update_conf, sender=Service )
