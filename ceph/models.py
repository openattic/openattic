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
from volumes.models import FileSystemVolume, VolumePool, BlockVolume

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

    def df(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").df(self.displayname)))

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
    volume      = models.ForeignKey(FileSystemVolume, null=True, blank=True)
    journal     = models.ForeignKey(BlockVolume,      null=True, blank=True)

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return "osd.%s (%s)" % (self.ceph_id, unicode(self.volume))

    def save( self, database_only=False, *args, **kwargs ):
        install = (self.id is None)
        models.Model.save(self, *args, **kwargs)
        if install and not database_only:
            fspath = self.volume.volume.path
            jnldev = self.journal.volume.path if self.journal is not None else ""
            get_dbus_object("/ceph").format_volume_as_osd(self.rbd_pool.cluster.displayname, fspath, jnldev)

class Mon(models.Model):
    cluster     = models.ForeignKey(Cluster)
    host        = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)

class MDS(models.Model):
    cluster     = models.ForeignKey(Cluster)
    host        = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)

class Ruleset(models.Model):
    cluster     = models.ForeignKey(Cluster)
    ceph_id     = models.IntegerField()
    name        = models.CharField(max_length=250)
    type        = models.IntegerField(default=1)
    min_size    = models.IntegerField(default=1)
    max_size    = models.IntegerField(default=10)

class Pool(VolumePool):
    cluster     = models.ForeignKey(Cluster)
    ceph_id     = models.IntegerField()
    size        = models.IntegerField(default=3)
    min_size    = models.IntegerField(default=2)
    pg_num      = models.IntegerField(default=64)
    pgp_num     = models.IntegerField(default=64)
    ruleset     = models.ForeignKey(Ruleset)

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return unicode(self.storageobj.name)

    @property
    def usedmegs(self):
        for poolinfo in self.cluster.df()["pools"]:
            if poolinfo["name"] == self.storageobj.name:
                return int(poolinfo["stats"]["kb_used"] / 1024.)
        raise KeyError("pool not found in ceph df")

    @property
    def status(self):
        return self.cluster.status

    @property
    def host(self):
        return Host.objects.get_current()

    def is_fs_supported(self, filesystem):
        return True

    def _create_volume_for_storageobject(self, storageobj, options):
        image = Image(rbd_pool=self, storageobj=storageobj)
        image.full_clean()
        image.save()
        return image


class Entity(models.Model):
    cluster     = models.ForeignKey(Cluster)
    entity      = models.CharField(max_length=250)
    key         = models.CharField(max_length=50)


class Image(BlockVolume):
    rbd_pool    = models.ForeignKey(Pool)

    def save( self, database_only=False, *args, **kwargs ):
        if database_only:
            return BlockVolume.save(self, *args, **kwargs)
        install = (self.id is None)
        BlockVolume.save(self, *args, **kwargs)
        if install:
            get_dbus_object("/ceph").rbd_create(self.rbd_pool.cluster.displayname, self.rbd_pool.storageobj.name, self.storageobj.name, self.storageobj.megs)

    def delete(self):
        BlockVolume.delete(self)
        get_dbus_object("/ceph").rbd_rm(self.rbd_pool.cluster.displayname, self.rbd_pool.storageobj.name, self.storageobj.name)

    @property
    def host(self):
        return Host.objects.get_current()

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        return self.rbd_pool.status

    @property
    def path(self):
        return "/dev/rbd/%s/%s" % (self.rbd_pool.storageobj.name, self.storageobj.name)
