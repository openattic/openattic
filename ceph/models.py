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

import json

from django.db import models
from django.utils.translation import ugettext_noop as _

from systemd import get_dbus_object, dbus_to_python
from ifconfig.models import Host
from volumes.models import FileSystemVolume

class Cluster(models.Model):
    AUTH_CHOICES = (
        ('none',  _('Authentication disabled')),
        ('cephx', _('CephX Authentication')),
        )

    uuid        = models.CharField(max_length=36, unique=True)
    displayname = models.CharField(max_length=250, default='', blank=True)
    auth_cluster_required   = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)
    auth_service_required   = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)
    auth_client_required    = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)

    def get_status(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").status(self.displayname)))

    @property
    def status(self):
        return self.get_status()["health"]["overall_status"]

    def __unicode__(self):
        return "'%s' (%s)" % (self.displayname, self.uuid)

class Type(models.Model):
    cluster     = models.ForeignKey(Cluster)
    ceph_id     = models.IntegerField()
    name        = models.CharField(max_length=50)

    class Meta:
        unique_together = (('cluster', 'ceph_id'), ('cluster', 'name'))

    def __unicode__(self):
        return "'%s' (%s)" % (self.name, self.ceph_id)

class Bucket(models.Model):
    cluster     = models.ForeignKey(Cluster)
    type        = models.ForeignKey(Type)
    ceph_id     = models.IntegerField()
    name        = models.CharField(max_length=50)
    parent      = models.ForeignKey('self', null=True, blank=True)
    weight      = models.FloatField(help_text="My weight in the parent container (if any).", default=1.0)
    alg         = models.CharField(max_length=50, default="straw",
                                   choices=(("uniform", "uniform"), ("list", "list"), ("tree", "tree"), ("straw", "straw")))
    hash        = models.CharField(max_length=50, default="rjenkins1")

    class Meta:
        unique_together = (('cluster', 'ceph_id'), ('cluster', 'name'))

    def __unicode__(self):
        return "'%s' (%s)" % (self.name, self.ceph_id)

class OSD(models.Model):
    cluster     = models.ForeignKey(Cluster)
    ceph_id     = models.IntegerField()
    uuid        = models.CharField(max_length=36, unique=True)
    bucket      = models.ForeignKey(Bucket)
    weight      = models.FloatField(help_text="My weight in the bucket.", default=1.0)
    is_by_oa    = models.BooleanField(help_text="True if this OSD has been set up by openATTIC.")
    volume      = models.ForeignKey(FileSystemVolume, null=True, blank=True)
    path        = models.CharField(max_length=250,    null=True, blank=True)

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return "osd.%s (%s)" % (self.ceph_id, unicode(self.volume))

class Mon(models.Model):
    cluster     = models.ForeignKey(Cluster)
    is_by_oa    = models.BooleanField(help_text="True if this OSD has been set up by openATTIC.")
    host        = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)

class MDS(models.Model):
    cluster     = models.ForeignKey(Cluster)
    is_by_oa    = models.BooleanField(help_text="True if this OSD has been set up by openATTIC.")
    host        = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)

class Pool(models.Model):
    cluster     = models.ForeignKey(Cluster)
    ceph_id     = models.IntegerField()
    name        = models.CharField(max_length=250)
    rep_size    = models.IntegerField()

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return unicode(self.host)

class Entity(models.Model):
    cluster     = models.ForeignKey(Cluster)
    entity      = models.CharField(max_length=250)
    key         = models.CharField(max_length=50)

