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

from __future__ import division

import json
import math
import os

from django.db import models
from django.utils.translation import ugettext_noop as _
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

from systemd import get_dbus_object, dbus_to_python
from systemd.helpers import Transaction
from ifconfig.models import Host
from volumes.models import StorageObject, FileSystemVolume, VolumePool, BlockVolume

from nodb.models import NodbModel

from ceph import librados
import ConfigParser


class RadosClientManager(object):

    instances = {}

    def __getitem__(self, fsid):
        if fsid not in self.instances:
            cluster_name = CephCluster.get_name(fsid)
            self.instances[fsid] = librados.Client(cluster_name)

        return self.instances[fsid]

rados = RadosClientManager()


class CephCluster(NodbModel):
    """Represents a Ceph cluster."""

    fsid = models.CharField(max_length=36, primary_key=True)
    name = models.CharField(max_length=100)

    @staticmethod
    def get_names():
        clusters = []
        for file in os.listdir('/etc/ceph'):
            if file.endswith('.conf') and os.access(file, os.R_OK):
                clusters.append(os.path.splitext(file)[0])
        return clusters

    @staticmethod
    def get_name(fsid):
        for conf_file in os.listdir('/etc/ceph'):
            if conf_file.endswith('.conf') and os.access(conf_file, os.R_OK):
                config = ConfigParser.ConfigParser()
                config.read(os.path.join('/etc/ceph/', conf_file))

                if config.get('global', 'fsid') == fsid:
                    return os.path.splitext(conf_file)[0]

        raise LookupError()

    @staticmethod
    def get_fsid(cluster_name):
        f = '/etc/ceph/{name}.conf'.format(name=cluster_name)
        if os.path.isfile(f) and os.access(f, os.R_OK):
            config = ConfigParser.ConfigParser()
            config.read(f)
            fsid = config.get('global', 'fsid')

            return fsid

        raise LookupError()

    @staticmethod
    def get_all_objects(context=None):
        result = []
        for cluster_name in CephCluster.get_names():
            fsid = CephCluster.get_fsid(cluster_name)
            cluster = CephCluster(fsid=fsid, name=cluster_name)
            cluster.pools = CephPool.objects.all({'cluster': cluster})
            result.append(cluster)

        return result

    def __str__(self):
        return self.name


class CephPoolHitSetParams(NodbModel):

    type = models.CharField(max_length=100)


class CephPoolTier(NodbModel):

    pool_id = models.IntegerField()


class CephPool(NodbModel):

    id = models.IntegerField(primary_key=True)
    cluster = models.ForeignKey(CephCluster)
    name = models.CharField(max_length=100)
    replicated = models.BooleanField()
    type = models.IntegerField()
    erasure_coded = models.BooleanField()
    erasure_code_profile = models.CharField(max_length=100)
    last_change = models.IntegerField()
    quota_max_objects = models.IntegerField()
    quota_max_bytes = models.IntegerField()
    hashpspool = models.BooleanField()
    full = models.BooleanField()
    pg_num = models.IntegerField()
    pgp_num = models.IntegerField()
    size = models.IntegerField()
    min_size = models.IntegerField()
    crush_ruleset = models.IntegerField()
    crash_replay_interval = models.IntegerField()
    num_bytes = models.IntegerField()
    num_objects = models.IntegerField()
    max_avail = models.IntegerField()
    kb_used = models.IntegerField()
    stripe_width = models.IntegerField()
    tier_of = models.IntegerField()
    write_tier = models.IntegerField()
    read_tier = models.IntegerField()
    target_max_bytes = models.IntegerField()
    hit_set_period = models.IntegerField()
    hit_set_count = models.IntegerField()
    hit_set_params = models.OneToOneField(CephPoolHitSetParams)

    @staticmethod
    def get_all_objects(context):
        result = []
        cluster = context['cluster']
        fsid = cluster.fsid

        osd_dump_data = rados[fsid].mon_command('osd dump')
        df_data = rados[fsid].mon_command('df')

        for pool_data in osd_dump_data['pools']:

            pool_id = pool_data['pool']
            stats = rados[fsid].get_stats(str(pool_data['pool_name']))
            disk_free_data = [elem for elem in df_data['pools'] if elem['id'] == pool_id][0]

            object_data = {
                'id': pool_id,
                'cluster': cluster,
                'name': pool_data['pool_name'],
                'replicated': pool_data['erasure_code_profile'] == '',
                'type': pool_data['type'],
                'erasure_coded': pool_data['erasure_code_profile'] != '',
                'erasure_code_profile': pool_data['erasure_code_profile'],
                'last_change': pool_data['last_change'],
                'hashpspool': 'hashpspool' in pool_data['flags_names'],
                'full': 'full' in pool_data['flags_names'],
                'min_size': pool_data['min_size'],
                'crash_replay_interval': pool_data['crash_replay_interval'],
                'pg_num': pool_data['pg_num'],
                'size': pool_data['size'],
                'crush_ruleset': pool_data['crush_ruleset'],
                'num_bytes': stats['num_bytes'],
                'num_objects': stats['num_objects'],
                'max_avail': disk_free_data['stats']['max_avail'],
                'kb_used': disk_free_data['stats']['kb_used'],
                # Considered advanced options
                'pgp_num': pool_data['pg_placement_num'],
                'stripe_width': pool_data['stripe_width'],
                'quota_max_bytes': pool_data['quota_max_bytes'],
                'quota_max_objects': pool_data['quota_max_objects'],
                # Cache tiering related
                'tier_of': pool_data['tier_of'],
                'write_tier': pool_data['write_tier'],
                'read_tier': pool_data['read_tier'],
                # Attributes for cache tiering
                'target_max_bytes': pool_data['target_max_bytes'],
                'hit_set_period': pool_data['hit_set_period'],
                'hit_set_count': pool_data['hit_set_count'],
                'hit_set_params': CephPoolHitSetParams(**pool_data['hit_set_params']),
            }

            ceph_pool = CephPool(**object_data)
            ceph_pool.tiers = [CephPoolTier(pool_id=id) for id in pool_data['tiers']]

            result.append(ceph_pool)

        return result


class Cluster(StorageObject):
    AUTH_CHOICES = (
        ('none',  _('Authentication disabled')),
        ('cephx', _('CephX Authentication')),
        )

    auth_cluster_required = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)
    auth_service_required = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)
    auth_client_required = models.CharField(max_length=10, default='cephx', choices=AUTH_CHOICES)

    def get_status(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").status(self.name)))

    def df(self):
        _df = json.loads(dbus_to_python(get_dbus_object("/ceph").df(self.name)))

        # Sometimes, "ceph df" returns total_space in KiB, and sometimes total_bytes.
        # See what we have and turn it all into megs.
        if "total_space" in _df["stats"]:
            _df["stats"]["total_space_megs"] = _df["stats"]["total_space"] / 1024.
            _df["stats"]["total_used_megs"] = _df["stats"]["total_used"] / 1024.
            _df["stats"]["total_avail_megs"] = _df["stats"]["total_avail"] / 1024.
        else:
            _df["stats"]["total_space_megs"] = _df["stats"]["total_bytes"] / 1024. / 1024.
            _df["stats"]["total_used_megs"] = _df["stats"]["total_used_bytes"] / 1024. / 1024.
            _df["stats"]["total_avail_megs"] = _df["stats"]["total_avail_bytes"] / 1024. / 1024.

        return _df

    def get_crushmap(self):
        osdmap = json.loads(dbus_to_python(get_dbus_object("/ceph").osd_dump(self.name)))
        try:
            return self.crushmapversion_set.get(epoch=osdmap["epoch"])
        except CrushmapVersion.DoesNotExist:
            crushmap = dbus_to_python(get_dbus_object("/ceph").osd_crush_dump(self.name))
            return self.crushmapversion_set.create(epoch=osdmap["epoch"], crushmap=crushmap)

    def get_osdmap(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").osd_dump(self.name)))

    def get_mds_stat(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").mds_stat(self.name)))

    def get_mon_status(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").mon_status(self.name)))

    def get_auth_list(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").auth_list(self.name)))

    def get_recommended_pg_num(self, repsize):
        """ Calculate the recommended number of PGs for a given repsize.

            See http://ceph.com/docs/master/rados/operations/placement-groups/ for details.
        """
        return int(2 ** math.ceil(math.log((self.osd_set.count() * 100 / repsize), 2)))

    @property
    def status(self):
        return self.get_status()["health"]["overall_status"]

    def __unicode__(self):
        return "'%s' (%s)" % (self.name, self.uuid)

    def set_crushmap(self, crushtree):
        buckets = crushtree["buckets"][:]
        parentbucket = {}
        ceph = get_dbus_object("/ceph")
        with Transaction():
            while buckets:
                cbucket = buckets.pop(0)
                if type(cbucket["id"]) is not int:
                    print "make bucket", cbucket["name"], cbucket["type_name"]
                    ceph.osd_crush_add_bucket(self.name, cbucket["name"], cbucket["type_name"])
                if cbucket["id"] in parentbucket:
                    print "make move %s %s=%s" % \
                          (cbucket["name"], parentbucket[cbucket["id"]]["type_name"],
                           parentbucket[cbucket["id"]]["name"])
                    ceph.osd_crush_move(self.name, cbucket["name"],
                                        parentbucket[cbucket["id"]]["type_name"],
                                        parentbucket[cbucket["id"]]["name"])
                for member in cbucket["items"]:
                    parentbucket[member["id"]] = cbucket
                buckets.extend(cbucket["items"])


class CrushmapVersion(models.Model):

    cluster = models.ForeignKey(Cluster)
    epoch = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, null=True, blank=True)
    crushmap = models.TextField()

    class Meta:
        unique_together = (("cluster", "epoch"),)

    @property
    def is_current(self):
        return self.epoch == self.cluster.get_osdmap()["epoch"]

    def get_tree(self):
        """Get the (slightly modified) CRUSH tree.

        Returns the CRUSH tree for the cluster. The `items` array of the `buckets` are modified so
        that they don't contain the OSDs anymore, but the children buckets.
        """

        crushmap = json.loads(self.crushmap)
        crushtree = dict(crushmap, buckets=[])

        parentbucket = {}

        for cbucket in crushmap["buckets"]:

            for member in cbucket["items"]:
                # Creates an array with all children using their IDs as keys and themselves as
                # values. This already excludes the root buckets!
                parentbucket[member["id"]] = cbucket

            # Clears the items of `crushmap['buckets']`.
            cbucket["items"] = []

        buckets = crushmap["buckets"][:]  # Make a copy of the `buckets` array.
        while buckets:
            cbucket = buckets.pop(0)

            if cbucket["id"] in parentbucket:  # If the current bucket has a parent.

                # Add the child (cbucket) to the `items` array of the parent object.
                parentbucket[cbucket["id"]]["items"].append(cbucket)

            else:  # Has to be a root bucket.

                # Add the root bucket to the `buckets` array. It would be empty otherwise!
                crushtree["buckets"].append(cbucket)

        return crushtree


class OSD(models.Model):
    cluster = models.ForeignKey(Cluster)
    ceph_id = models.IntegerField()
    uuid = models.CharField(max_length=36, unique=True)
    volume = models.ForeignKey(FileSystemVolume, null=True, blank=True)
    journal = models.ForeignKey(BlockVolume, null=True, blank=True)

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return "osd.%s (%s)" % (self.ceph_id, unicode(self.volume))

    def save(self, database_only=False, *args, **kwargs):
        install = (self.id is None)
        super(OSD, self).save(*args, **kwargs)
        if install and not database_only:
            fspath = self.volume.volume.path
            jnldev = self.journal.volume.path if self.journal is not None else ""
            get_dbus_object("/ceph").format_volume_as_osd(self.rbd_pool.cluster.name, fspath,
                                                          jnldev)
            # set upper volume
            volume_so = self.volume.storageobj
            volume_so.upper = self.cluster
            volume_so.save()

    def get_status(self):
        status = []
        if self.volume is not None:
            status.extend(self.volume.get_status())
        if self.journal is not None:
            status.extend(self.journal.get_status())
        if not status:
            status = ["unknown"]
        return status


class Mon(models.Model):
    cluster = models.ForeignKey(Cluster)
    host = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)


class MDS(models.Model):
    cluster = models.ForeignKey(Cluster)
    host = models.ForeignKey(Host)

    def __unicode__(self):
        return unicode(self.host)


class Pool(VolumePool):
    cluster = models.ForeignKey(Cluster)
    ceph_id = models.IntegerField()
    size = models.IntegerField(default=3)
    min_size = models.IntegerField(default=2)
    ruleset = models.IntegerField(default=0)

    class Meta:
        unique_together = (('cluster', 'ceph_id'),)

    def __unicode__(self):
        return unicode(self.storageobj.name)

    def full_clean(self, exclude=None, validate_unique=True):
        super(Pool, self).full_clean(exclude=exclude, validate_unique=validate_unique)
        if self.min_size > self.size:
            raise ValidationError({"min_size": ["min_size must be less than or equal to size"]})

    def save(self, database_only=False, *args, **kwargs):
        install = (self.id is None)
        super(Pool, self).save(*args, **kwargs)
        if database_only:
            return
        if install:
            get_dbus_object("/ceph").osd_pool_create(self.cluster.name, self.storageobj.name,
                                                     self.cluster.get_recommended_pg_num(self.size),
                                                     self.ruleset)
        else:
            get_dbus_object("/ceph").osd_pool_set(self.cluster.name, self.storageobj.name,
                                                  "size", str(self.size))
            get_dbus_object("/ceph").osd_pool_set(self.cluster.name, self.storageobj.name,
                                                  "min_size", str(self.min_size))
            get_dbus_object("/ceph").osd_pool_set(self.cluster.name, self.storageobj.name,
                                                  "crush_ruleset", str(self.ruleset))

    def delete(self):
        super(Pool, self).delete()
        get_dbus_object("/ceph").osd_pool_delete(self.cluster.name, self.storageobj.name)

    @property
    def usedmegs(self):
        for poolinfo in self.cluster.df()["pools"]:
            if poolinfo["name"] == self.storageobj.name:
                return int(poolinfo["stats"]["kb_used"] / 1024.)
        raise KeyError("pool not found in ceph df")

    @property
    def status(self):
        return self.cluster.status

    def get_status(self):
        return [{
            "HEALTH_OK": "online",
            "HEALTH_WARN": "degraded",
            "HEALTH_CRIT": "failed"
        }[self.cluster.status]]

    @property
    def host(self):
        return Host.objects.get_current()

    def is_fs_supported(self, filesystem):
        return True

    @classmethod
    def create_volumepool(cls, vp_storageobj, blockvolumes, options):
        return None

    def _create_volume_for_storageobject(self, storageobj, options):
        image = Image(rbd_pool=self, storageobj=storageobj)
        image.full_clean()
        image.save()
        return image

    def get_volumepool_usage(self, stats):
        df = self.cluster.df()
        for poolinfo in df["pools"]:
            if poolinfo["name"] == self.storageobj.name:
                stats["vp_megs"] = df["stats"]["total_space_megs"] / self.size
                stats["vp_used"] = poolinfo["stats"]["kb_used"] / 1024.
                stats["vp_free"] = df["stats"]["total_avail_megs"] / self.size
                stats["steal"] = df["stats"]["total_space_megs"] - stats["vp_used"] - \
                    stats["vp_free"]
                stats["used"] = max(stats.get("used", None), stats["vp_used"])
                stats["free"] = min(stats.get("free", float("inf")), stats["vp_free"])
                stats["vp_max_new_fsv"] = stats["vp_free"]
                stats["vp_max_new_bv"] = stats["vp_free"]
                break
        return stats


class Entity(models.Model):
    cluster = models.ForeignKey(Cluster)
    entity = models.CharField(max_length=250)
    key = models.CharField(max_length=50, blank=True)

    def save(self, database_only=False, *args, **kwargs):
        if self.id is None and not database_only:
            get_dbus_object("/ceph").auth_add(self.cluster.name, self.entity)
            self.key = json.loads(get_dbus_object("/ceph").auth_get_key(self.cluster.name,
                                                                        self.entity))["key"]
        super(Entity, self).save(*args, **kwargs)

    def delete(self):
        super(Entity, self).delete()
        get_dbus_object("/ceph").auth_del(self.cluster.name, self.entity)

    def __unicode__(self):
        return self.entity


class Image(BlockVolume):
    rbd_pool = models.ForeignKey(Pool)

    def save(self, database_only=False, *args, **kwargs):
        if database_only:
            return BlockVolume.save(self, *args, **kwargs)
        install = (self.id is None)
        super(Image, self).save(*args, **kwargs)
        if install:
            get_dbus_object("/ceph").rbd_create(self.rbd_pool.cluster.name,
                                                self.rbd_pool.storageobj.name,
                                                self.storageobj.name, self.storageobj.megs)
            get_dbus_object("/ceph").rbd_map(self.rbd_pool.cluster.name,
                                             self.rbd_pool.storageobj.name, self.storageobj.name)

    def delete(self):
        super(Image, self).delete()
        get_dbus_object("/ceph").rbd_unmap(self.rbd_pool.cluster.name,
                                           self.rbd_pool.storageobj.name, self.storageobj.name)
        get_dbus_object("/ceph").rbd_rm(self.rbd_pool.cluster.name,
                                        self.rbd_pool.storageobj.name, self.storageobj.name)

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

    def get_volume_usage(self, stats):
        return

    def get_status(self):
        return self.rbd_pool.get_status()
