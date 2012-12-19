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

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass

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


class Unit(models.Model):
    index       = models.IntegerField()
    name        = models.CharField(max_length=150, blank=True)
    serial      = models.CharField(max_length=150, blank=True)
    controller  = models.ForeignKey(Controller)
    unittype    = models.CharField(max_length=150, blank=True)
    status      = models.CharField(max_length=150, blank=True)
    rebuild     = models.IntegerField(blank=True, null=True)
    verify      = models.IntegerField(blank=True, null=True)
    chunksize   = models.IntegerField()
    size        = models.IntegerField()
    autoverify  = models.BooleanField()
    rdcache     = models.CharField(max_length=150, blank=True)
    wrcache     = models.CharField(max_length=150, blank=True)

    objects     = getHostDependentManagerClass("controller__host")()
    all_objects = models.Manager()


class Disk(models.Model):
    controller  = models.ForeignKey(Controller)
    port        = models.IntegerField()
    disktype    = models.CharField(max_length=150)
    encl        = models.ForeignKey(Enclosure)
    enclslot    = models.IntegerField()
    size        = models.IntegerField()
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


