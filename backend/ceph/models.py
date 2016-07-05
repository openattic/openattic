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

import ConfigParser
import itertools
import json
import logging
import math
import os

from os.path import exists

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import ugettext_noop as _

from ceph import librados
from ceph.librados import MonApi, undo_transaction, RbdApi
from ifconfig.models import Host
from nodb.models import NodbModel, JsonField
from systemd import get_dbus_object, dbus_to_python
from systemd.helpers import Transaction
from volumes.models import StorageObject, FileSystemVolume, VolumePool, BlockVolume

logger = logging.getLogger(__name__)


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
    health = models.CharField(max_length=11)
    performance_data_options = JsonField(base_type=list, editable=False)

    @staticmethod
    def has_valid_config_file():
        conf_dir = '/etc/ceph'
        # Check for existance of /etc/ceph.
        if os.path.isdir(conf_dir):
            # Look into that directory and check if at least one conf file exists and is readable.
            for file_name in os.listdir(conf_dir):
                file_path = os.path.join(conf_dir, file_name)
                if file_name.endswith('.conf') and os.access(file_path, os.R_OK):
                    return True

        logger.error('No usable Ceph configuration file could be found')
        return False

    @staticmethod
    def get_names():
        clusters = []

        if not CephCluster.has_valid_config_file():
            return clusters

        for file in os.listdir('/etc/ceph'):
            if file.endswith('.conf'):
                if os.access(os.path.join('/etc/ceph', file), os.R_OK):
                    clusters.append(os.path.splitext(file)[0])
                else:
                    logger.warning('Could\'nt access {}'.format(file))

        return clusters

    @staticmethod
    def get_name(fsid):
        for conf_file in os.listdir('/etc/ceph'):
            conf_file_path = os.path.join('/etc/ceph', conf_file)
            if conf_file.endswith('.conf') and os.access(conf_file_path, os.R_OK):
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
    def get_status(fsid, status_command='status'):
        return rados[fsid].mon_command(status_command)

    @staticmethod
    def get_all_objects(context, query):
        result = []
        for cluster_name in CephCluster.get_names():
            fsid = CephCluster.get_fsid(cluster_name)
            cluster_health = CephCluster.get_status(fsid, 'health')['overall_status']

            sources = []

            if "nagios" in settings.INSTALLED_APPS:
                try:
                    cluster_rrd = CephCluster._get_cluster_rrd(fsid)
                    sources = list(cluster_rrd.sources)
                except SystemError:
                    pass

            cluster = CephCluster(fsid=fsid, name=cluster_name, health=cluster_health,
                                  performance_data_options=sources)
            result.append(cluster)

        return result

    @staticmethod
    def get_performance_data(fsid, filter=None):
        """
        Returns the performance data by the clusters FSID and consideration of the filter parameters
        if given.

        :param fsid: FSID of the cluster
        :rtype: str
        :param filter: The performance data will be filtered by these sources (based on the RRD
            file)
        :rtype: list[str]
        :return: Returns a list of performance data or the message that the Nagios module isn't
            installed.
        :rtype: list[dict] or str
        """
        if "nagios" in settings.INSTALLED_APPS:
            from nagios.graphbuilder import Graph

            graph = Graph()
            rrd = CephCluster._get_cluster_rrd(fsid)

            sources = filter if filter else rrd.sources
            for source in sources:
                source_obj = rrd.get_source(source)
                graph.add_source(source_obj)

            perf_data = graph.get_json()
            return graph.convert_rrdtool_json_to_nvd3(perf_data)
        else:
            return "Nagios does not appear to be installed, no performance data could be returned."

    @staticmethod
    def _get_cluster_rrd(fsid):
        """
        Returns the RRD file by the clusters FSID.
        Note: Make sure the Nagios module is installed before calling this method!

        :param fsid: FSID of the cluster
        :rtype: str
        :return: RRD file of the cluster
        :rtype: nagios.graphbuilder.RRD
        """

        from nagios.conf import settings as nagios_settings
        from nagios.graphbuilder import RRD

        curr_host = Host.objects.get_current()

        xmlpath = nagios_settings.XML_PATH % {
            "host": curr_host,
            "serv": "Check_CephCluster_{}".format(fsid)
        }

        if not exists(xmlpath):
            raise SystemError("XML file '{}' could not be found for the cluster with FSID "
                              "'{}'. There are two possible reasons: a) The Ceph cluster was "
                              "just added to openATTIC and 'oaconfig install' was executed. -> "
                              "Please wait some time until Nagios runs again and creates the "
                              "file. b) You haven't run 'oaconfig install' after adding the "
                              "Ceph cluster to openATTIC -> Please run 'oaconfig install' to "
                              "create all needed configuration files for Nagios."
                              .format(xmlpath, fsid))
        return RRD(xmlpath)

    def __str__(self):
        return self.name


class CephPool(NodbModel):

    id = models.IntegerField(primary_key=True, editable=False)
    cluster = models.ForeignKey(CephCluster, editable=False, null=True, blank=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100, choices=[('replicated', 'replicated'), ('erasure', 'erasure')])
    erasure_code_profile = models.ForeignKey("CephErasureCodeProfile", null=True, default=None, blank=True)
    last_change = models.IntegerField(editable=False)
    quota_max_objects = models.IntegerField()
    quota_max_bytes = models.IntegerField()
    full = models.BooleanField(default=None, editable=False)
    pg_num = models.IntegerField()
    pgp_num = models.IntegerField(editable=False)
    size = models.IntegerField(help_text='Replica size')
    min_size = models.IntegerField(default=1, null=True, editable=True)
    crush_ruleset = models.IntegerField()
    crash_replay_interval = models.IntegerField()
    num_bytes = models.IntegerField(editable=False)
    num_objects = models.IntegerField(editable=False)
    max_avail = models.IntegerField(editable=False)
    kb_used = models.IntegerField(editable=False)
    stripe_width = models.IntegerField(editable=False)
    cache_mode = models.CharField(max_length=100, choices=[(c, c) for c in 'none|writeback|forward|readonly|'
                                                                           'readforward|readproxy'.split('|')])
    tier_of = models.ForeignKey("CephPool", null=True, default=None, blank=True, related_name='related_tier_of')
    write_tier = models.ForeignKey("CephPool", null=True, default=None, blank=True, related_name='related_write_tier')
    read_tier = models.ForeignKey("CephPool", null=True, default=None, blank=True, related_name='related_read_tier')
    target_max_bytes = models.IntegerField()
    hit_set_period = models.IntegerField()
    hit_set_count = models.IntegerField()
    hit_set_params = JsonField(base_type=dict, editable=False)
    tiers = JsonField(base_type=list, editable=False)
    flags = JsonField(base_type=list, editable=False)

    pool_snaps = JsonField(base_type=list, editable=False)

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        result = []
        cluster = context.cluster
        fsid = cluster.fsid

        osd_dump_data = MonApi(rados[fsid]).osd_dump()
        df_data = rados[fsid].mon_command('df')

        for pool_data in osd_dump_data['pools']:

            pool_id = pool_data['pool']
            stats = rados[fsid].get_stats(str(pool_data['pool_name']))
            disk_free_data = [elem for elem in df_data['pools'] if elem['id'] == pool_id][0]

            object_data = {
                'id': pool_id,
                'cluster': cluster,
                'name': pool_data['pool_name'],
                'type': {1: 'replicated', 3: 'erasure'}[pool_data['type']],  # type is an undocumented dump of
                # https://github.com/ceph/ceph/blob/289c10c9c79c46f7a29b5d2135e3e4302ac378b0/src/osd/osd_types.h#L1035
                'erasure_code_profile': CephErasureCodeProfile(name=pool_data['erasure_code_profile']
                                                               ) if pool_data['erasure_code_profile'] else None,
                'last_change': pool_data['last_change'],
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
                'cache_mode': pool_data['cache_mode'],
                'tier_of': CephPool(id=pool_data['tier_of']) if pool_data['tier_of'] > 0 else None,
                'write_tier': CephPool(id=pool_data['write_tier']) if pool_data['write_tier'] > 0 else None,
                'read_tier': CephPool(id=pool_data['read_tier']) if pool_data['read_tier'] > 0 else None,
                # Attributes for cache tiering
                'target_max_bytes': pool_data['target_max_bytes'],
                'hit_set_period': pool_data['hit_set_period'],
                'hit_set_count': pool_data['hit_set_count'],
                'hit_set_params': pool_data['hit_set_params'],
                'tiers': pool_data['tiers'],
                'flags': pool_data['flags_names'].split(','),
                'pool_snaps': pool_data['pool_snaps'],
            }

            ceph_pool = CephPool(**object_data)

            result.append(ceph_pool)

        return result

    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Ceph state-machine in a sane way.
        3. Providing a RESTful API.
        """
        context = CephPool.objects.nodb_context
        insert = self.id is None
        with undo_transaction(MonApi(rados[context.fsid]), re_raise_exception=True) as api:
            if insert:
                api.osd_pool_create(self.name,
                                    self.pg_num,
                                    self.pg_num,
                                    # second pg_num is in fact pgp_num, but we don't want to allow
                                    # different values here.
                                    self.type,
                                    self.erasure_code_profile.name if self.erasure_code_profile else None)

            diff, original = self.get_modified_fields(name=self.name) if insert else self.get_modified_fields()
            if not insert:
                self.set_read_only_fields(original)

            def schwartzian_transform(obj):
                key, val = obj
                if key == 'tier_of_id':
                    return (1 if val is None else -1), obj  # move to start or end.
                return 0, obj

            for key, value in sorted(diff.items(), key=schwartzian_transform):
                if key == 'pg_num':
                    if not insert:
                        api.osd_pool_set(self.name, "pg_num", value, undo_previous_value=original.pg_num)
                        api.osd_pool_set(self.name, "pgp_num", value, undo_previous_value=original.pg_num)
                elif key == 'cache_mode':
                    api.osd_tier_cache_mode(self.name, value, undo_previous_mode=original.cache_mode)
                elif key == 'tier_of_id':
                    if self.tier_of is None:
                        tier_of_target = CephPool.objects.get(id=original.tier_of.id)
                        api.osd_tier_remove(tier_of_target.name, self.name)
                    else:
                        tier_of_target = CephPool.objects.get(id=self.tier_of.id)
                        api.osd_tier_add(tier_of_target.name, self.name)
                elif key == 'read_tier_id':
                    if self.read_tier is None:
                        read_tier_target = CephPool.objects.get(id=original.read_tier.id)
                        api.osd_tier_remove_overlay(self.name, undo_previous_overlay=read_tier_target.name)
                    else:
                        read_tier_target = CephPool.objects.get(id=self.read_tier.id)
                        api.osd_tier_set_overlay(self.name, read_tier_target.name)
                elif self.type == 'replicated' and key not in ['name']:
                    api.osd_pool_set(self.name, key, value, undo_previous_value=getattr(original, key))
                elif self.type == 'erasure' and key not in ['name', 'size']:
                    api.osd_pool_set(self.name, key, value, undo_previous_value=getattr(original, key))
                else:
                    logger.warning('Tried to set "{}" to "{}" on pool "{}" aka "{}", which is not '
                                   'supported'.format(key, value, self.id, self.name))

            super(CephPool, self).save(*args, **kwargs)

    def delete(self, using=None):
        context = CephPool.objects.nodb_context
        api = MonApi(rados[context.fsid])
        api.osd_pool_delete(self.name, self.name, "--yes-i-really-really-mean-it")

    def create_snapshot(self, name):
        context = CephPool.objects.nodb_context
        api = MonApi(rados[context.fsid])
        api.osd_pool_mksnap(self.name, name)

    def delete_snapshot(self, name):
        context = CephPool.objects.nodb_context
        api = MonApi(rados[context.fsid])
        api.osd_pool_rmsnap(self.name, name)


class CephErasureCodeProfile(NodbModel):
    name = models.CharField(max_length=100, primary_key=True)
    k = models.IntegerField()
    m = models.IntegerField()
    plugin = models.CharField(max_length=100, editable=False)
    technique = models.CharField(max_length=100, editable=False)
    jerasure_per_chunk_alignment = models.CharField(max_length=100, editable=False)
    ruleset_failure_domain = models.CharField(max_length=100, blank=True,
                                              choices=[('rack', 'rack'), ('host', 'host'), ('osd', 'osd')])
    ruleset_root = models.CharField(max_length=100, editable=False)
    w = models.IntegerField(editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        return [CephErasureCodeProfile(name=profile,
                                       **CephErasureCodeProfile.make_model_args(
                                           MonApi(rados[context.fsid]).osd_erasure_code_profile_get(profile)
                                       ))
                for profile in MonApi(rados[context.fsid]).osd_erasure_code_profile_ls()]

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        context = self.__class__.objects.nodb_context
        if not force_insert:
            raise NotImplementedError('Updating is not supported.')
        profile = ['k={}'.format(self.k), 'm={}'.format(self.m)]
        if self.ruleset_failure_domain:
            profile.append('ruleset-failure-domain={}'.format(self.ruleset_failure_domain))
        MonApi(rados[context.fsid]).osd_erasure_code_profile_set(self.name, profile)

    def delete(self, using=None):
        context = self.__class__.objects.nodb_context
        MonApi(rados[context.fsid]).osd_erasure_code_profile_rm(self.name)


class CephOsd(NodbModel):
    id = models.IntegerField(primary_key=True, editable=False)
    crush_weight = models.FloatField()
    depth = models.IntegerField()
    exists = models.IntegerField(editable=False)
    name = models.CharField(max_length=100, editable=False)
    primary_affinity = models.FloatField()
    reweight = models.FloatField()
    status = models.CharField(max_length=100, editable=False)
    type = models.CharField(max_length=100, editable=False)
    hostname = models.CharField(max_length=256, editable=False)
    in_state = models.IntegerField()

    # from pg dump
    kb = models.IntegerField(editable=False)
    kb_used = models.IntegerField(editable=False)
    kb_avail = models.IntegerField(editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        osds = sorted(rados[context.fsid].list_osds(), key=lambda osd: osd['id'])
        osd_dump_data = sorted(MonApi(rados[context.fsid]).osd_dump()['osds'], key=lambda osd: osd['osd'])
        pg_dump_data = sorted(MonApi(rados[context.fsid]).pg_dump()['osd_stats'], key=lambda osd: osd['osd'])
        return [CephOsd(**CephOsd.make_model_args(dict(in_state=dump['in'], **dict(osd, **pg_dump))))
                for (osd, dump, pg_dump)
                in zip(osds, osd_dump_data, pg_dump_data)]

    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Ceph state-machine in a sane way.
        3. Providing a RESTful API.
        """
        context = CephPool.objects.nodb_context
        if self.id is None:
            raise ValidationError('Creating OSDs is not supported.')
        with undo_transaction(MonApi(rados[context.fsid]), re_raise_exception=True) as api:
            diff, original = self.get_modified_fields()

            for key, value in diff.items():
                if key == 'in_state':
                    if value:
                        api.osd_in(self.name)
                    else:
                        api.osd_out(self.name)
                elif key == 'reweight':
                    api.osd_crush_reweight(self.name, value, original.reweight)
                else:
                    logger.warning('Tried to set "{}" to "{}" on osd "{}", which is not '
                                   'supported'.format(key, value, self.name))

            super(CephOsd, self).save(*args, **kwargs)

    @property
    def utilization(self):
        return float(self.kb_used) / float(self.kb_avail)


class CephPg(NodbModel):

    acting = JsonField(base_type=list, editable=False)
    acting_primary = models.IntegerField()
    blocked_by = JsonField(base_type=list, editable=False)
    created = models.IntegerField()
    last_active = models.DateTimeField(null=True)
    last_became_active = models.DateTimeField()
    last_became_peered = models.DateTimeField()
    last_change = models.DateTimeField()
    last_clean = models.DateTimeField()
    last_clean_scrub_stamp = models.DateTimeField()
    last_deep_scrub = models.DateTimeField()
    last_deep_scrub_stamp = models.DateTimeField()
    last_epoch_clean = models.IntegerField()
    last_fresh = models.DateTimeField()
    last_fullsized = models.DateTimeField()
    last_peered = models.DateTimeField()
    last_scrub = models.DateTimeField()
    last_scrub_stamp = models.DateTimeField()
    last_undegraded = models.DateTimeField()
    last_unstale = models.DateTimeField()
    log_size = models.IntegerField()
    log_start = models.CharField(max_length=100)
    mapping_epoch = models.IntegerField()
    ondisk_log_size = models.IntegerField()
    ondisk_log_start = models.CharField(max_length=100)
    parent = models.CharField(max_length=100)
    parent_split_bits = models.IntegerField()
    pgid = models.CharField(max_length=100, primary_key=True)
    reported_epoch = models.CharField(max_length=100)
    reported_seq = models.CharField(max_length=100)
    stat_sum = JsonField(base_type=dict, editable=False)
    state = models.CharField(max_length=100)
    stats_invalid = models.CharField(max_length=100)
    up = JsonField(base_type=list, editable=False)
    up_primary = models.IntegerField()
    version = models.CharField(max_length=100)

    #  dummy fields for filtering
    osd_id = models.IntegerField()
    pool_name = models.CharField(max_length=100)

    @staticmethod
    def get_mon_command_by_query(query):
        """
        :type query: nodb.models.NoDbQuery

        """
        logger.debug('pg query = %s', query)

        def get_argdict():
            mapping = {
                'osd_id__exact': 'osd',
                'pool_name__exact': 'poolstr'
            }
            argdict = {}
            if query.q is None:
                return argdict
            if len(query.q.children) != 1:
                return argdict
            if query.q.children[0] not in mapping.keys():
                return argdict

            return {mapping[query.q.children[0][0]]: str(query.q.children[0][1])}

        def get_command():
            mapping = {
                'osd_id__exact': 'pg ls-by-osd',
                'pool_name__exact': 'pg ls-by-pool'
            }

            if query.q is None or len(query.q.children) != 1:
                return 'pg ls'
            if query.q.children[0] not in mapping.keys():
                return 'pg ls'

            return mapping[query.q.children[0][0]]
        return get_command(), get_argdict()

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        cmd, argdict = CephPg.get_mon_command_by_query(query)
        try:
            pgs = rados[context.fsid].mon_command(cmd, argdict)
        except librados.ExternalCommandError, e:
            logger.exception('failed to get pgs: "%s" "%s" "%s"', cmd, argdict, e)
            return []

        ret = []
        for pg in pgs:
            model_args = CephPg.make_model_args(pg)
            if 'osd' in argdict:
                model_args['osd_id'] = argdict['osd']
            if 'poolstr' in argdict:
                model_args['pool_name'] = argdict['poolstr']
            ret.append(CephPg(**model_args))
        return ret


def aggregate_dict(*args, **kwargs):
    ret = {}
    for arg in args:
        ret.update(arg)
    ret.update(**kwargs)
    return ret


class CephRbd(NodbModel):  # aka RADOS block device
    """
    See http://tracker.ceph.com/issues/15448
    """
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=100)
    pool = models.ForeignKey(CephPool)
    size = models.IntegerField(help_text='Bytes', default=4 * 1024 ** 3)
    obj_size = models.IntegerField(null=True, blank=True)
    num_objs = models.IntegerField(editable=False)
    block_name_prefix = models.CharField(max_length=100, editable=False)
    features = JsonField(base_type=list, null=True, blank=True,
                         help_text='For example: [{}]'.format(', '.join(['"{}"'.format(v)
                                                                         for v
                                                                         in RbdApi.get_feature_mapping().values()])))
    old_format = models.BooleanField(default=False)
    used_size = models.IntegerField(editable=False)

    def __init__(self, *args, **kwargs):
        super(CephRbd, self).__init__(*args, **kwargs)
        self.id = '{}.{}'.format(self.pool.id, self.name)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        api = RbdApi(rados[context.fsid])

        pools = CephPool.objects.all()
        rbd_name_pools = (itertools.chain.from_iterable((((image, pool) for image in api.list(pool.name))
                                                         for pool in pools)))
        rbds = ((aggregate_dict(api.image_stat(pool.name, image_name),
                                api.image_disk_usage(pool.name, image_name),  # This is really expensive. You should
                                # first try to only call "rbd du" for rbds that will be serialized.
                                old_format=api.image_old_format(pool.name, image_name),
                                features=api.image_features(pool.name, image_name),
                                name=image_name),
                 pool)
                for (image_name, pool)
                in rbd_name_pools)

        return [CephRbd(pool=pool, **CephRbd.make_model_args(rbd))
                for (rbd, pool)
                in rbds]

    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Ceph state-machine in a sane way.
        3. Providing a RESTful API.
        """
        context = CephPool.objects.nodb_context
        insert = self._state.adding  # there seems to be no id field.

        with undo_transaction(RbdApi(rados[context.fsid]), re_raise_exception=True, exception_type=CephRbd.DoesNotExist) as api:

            if insert:
                order = None
                if self.obj_size is not None and self.obj_size > 0:
                    order = int(round(math.log(float(self.obj_size), 2)))
                api.create(self.pool.name, self.name, self.size, features=self.features, old_format=self.old_format, order=order)

            diff, original = self.get_modified_fields()
            self.set_read_only_fields(original)

            for key, value in diff.items():
                if key == 'size':
                    assert not insert
                    api.image_resize(self.pool.name, self.name, value)
                if key == 'features':
                    if not insert:
                        for feature in set(original.features).difference(set(value)):
                            api.image_set_feature(self.pool.name, self.name, feature, False)
                        for feature in set(value).difference(set(original.features)):
                            api.image_set_feature(self.pool.name, self.name, feature, True)
                    else:
                        logger.warning('Tried to set features, but they should already match. {} != {}'.format(original.features, value))
                else:
                    logger.warning('Tried to set "{}" to "{}" on rbd "{}", which is not '
                                   'supported'.format(key, value, self.name))

            super(CephRbd, self).save(*args, **kwargs)

    def delete(self, using=None):
        context = CephPool.objects.nodb_context
        api = RbdApi(rados[context.fsid])
        api.remove(self.pool.name, self.name)


class CephFs(NodbModel):
    name = models.CharField(max_length=100, primary_key=True)
    metadata_pool = models.ForeignKey(CephPool, related_name='metadata_of_ceph_fs')
    data_pools = JsonField(base_type=list)

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        api = MonApi(rados[context.fsid])

        ret = []
        for fs in api.fs_ls():
            args = CephFs.make_model_args(fs)
            args['data_pools'] = fs['data_pool_ids']
            args['metadata_pool'] = CephPool.objects.get(id=fs['metadata_pool_id'])
            ret.append(CephFs(**args))

        return ret

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        context = self.__class__.objects.nodb_context
        insert = self._state.adding
        if not insert:
            raise NotImplementedError('Updating is not supported.')
        data_pool = CephPool.objects.get(id=self.data_pools[0])
        MonApi(rados[context.fsid]).fs_new(self.name, self.metadata_pool.name, data_pool.name)

    def delete(self, using=None):
        context = self.__class__.objects.nodb_context
        MonApi(rados[context.fsid]).fs_rm(self.name, '--yes-i-really-mean-it')



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

    def get_mds_dump(self):
        return json.loads(dbus_to_python(get_dbus_object("/ceph").mds_dump(self.name)))

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
