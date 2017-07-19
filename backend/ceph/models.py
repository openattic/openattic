# -*- coding: utf-8 -*-

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
import logging
import math
import os
from StringIO import StringIO

from contextlib import contextmanager

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.shortcuts import get_object_or_404

from ceph import librados
from ceph.librados import MonApi, undo_transaction, RbdApi, Keyring, call_librados
import ceph.tasks
from exception import NotSupportedError
from ifconfig.models import Host
from librados import ExternalCommandError
from nodb.models import NodbModel, JsonField, NodbManager, bulk_attribute_setter
from systemd import get_dbus_object
from taskqueue.models import TaskQueue
from utilities import aggregate_dict, zip_by_keys

try:
    from ceph_iscsi.models import iSCSITarget
except ImportError:
    iSCSITarget = None
from rest_client import RequestException

logger = logging.getLogger(__name__)


class RadosMixin:

    @staticmethod
    def mon_api(fsid=None):
        """
        :type fsid: str | unicode
        """
        if fsid is None:
            fsid = NodbManager.nodb_context.fsid
        return MonApi(fsid)

    @staticmethod
    def rbd_api(fsid=None):
        """
        :type fsid: str | unicode
        """
        if fsid is None:
            fsid = NodbManager.nodb_context.fsid
        return RbdApi(fsid)


class CephCluster(NodbModel, RadosMixin):
    """Represents a Ceph cluster."""

    fsid = models.CharField(max_length=36, primary_key=True)
    name = models.CharField(max_length=100)
    health = models.CharField(max_length=11)
    performance_data_options = JsonField(base_type=list, editable=False)

    @staticmethod
    def has_valid_config_file_and_keyring(cluster_name="ceph", ceph_dir="/etc/ceph"):
        valid = True

        # Check for existance of Ceph directory
        if not os.path.isdir(ceph_dir):
            valid = False
            logger.error("No Ceph config directory found at '{}'".format(ceph_dir))
        else:
            # Check if valid config file exists
            file_path = os.path.join(ceph_dir, cluster_name + ".conf")

            if not os.path.exists(file_path):
                valid = False
                logger.error("No Ceph cluster configuration file '{}' found".format(file_path))
            else:
                # If yes check if config file is accessible
                if not os.access(file_path, os.R_OK):
                    valid = False
                    logger.error("Ceph configuration file '{}' is not accessible, permission denied"
                                 .format(file_path))
            # Check for existing and accessible keyring
            try:
                Keyring(cluster_name, ceph_dir)
            except RuntimeError:
                valid = False

        return valid

    @staticmethod
    def get_names():
        clusters = []

        for file in os.listdir('/etc/ceph'):
            if file.endswith('.conf'):
                cluster_name = os.path.splitext(file)[0]
                if CephCluster.has_valid_config_file_and_keyring(cluster_name):
                    clusters.append(cluster_name)
        return clusters

    @staticmethod
    def get_name(fsid):
        for conf_file in os.listdir('/etc/ceph'):
            if conf_file.endswith('.conf'):
                cluster_name = os.path.splitext(conf_file)[0]
                if CephCluster.has_valid_config_file_and_keyring(cluster_name):
                    config = CephCluster._get_confobj(os.path.join('/etc/ceph/', conf_file))

                    if config.get('global', 'fsid') == fsid:
                        return cluster_name

        raise LookupError()

    @staticmethod
    def get_fsid(cluster_name):
        f = '/etc/ceph/{name}.conf'.format(name=cluster_name)
        if CephCluster.has_valid_config_file_and_keyring(cluster_name):
            config = CephCluster._get_confobj(f)
            fsid = config.get('global', 'fsid')
            return fsid

        raise LookupError()

    @staticmethod
    def _get_confobj(file_name):
        cp = ConfigParser.RawConfigParser()
        with open(file_name) as f:
            cp.readfp(StringIO('\n'.join(line.strip() for line in f)))
        return cp

    @property
    def status(self):
        val = self.mon_api(self.fsid).status()
        if 'timechecks' not in val:
            try:
                val['timechecks'] = self.mon_api(self.fsid).time_sync_status()
            except Exception:
                logger.exception('time_sync_status failed.')
                val['timechecks'] = {}
        return val

    @staticmethod
    def get_all_objects(context, query):
        result = []
        for cluster_name in CephCluster.get_names():
            fsid = CephCluster.get_fsid(cluster_name)
            cluster = CephCluster(fsid=fsid, name=cluster_name)
            result.append(cluster)

        return result

    def get_crushmap(self):
        with fsid_context(self.fsid):
            return CrushmapVersion.objects.get()

    @bulk_attribute_setter(['health'])
    def set_cluster_health(self, objects, field_names):
        health = self.mon_api(self.fsid).health()
        # Ceph Luminous > 12.1 renamed `overall_status` to `status`
        self.health = health['overall_status' if 'overall_status' in health else 'status']

    @bulk_attribute_setter(['performance_data_options'])
    def set_performance_data_options(self, objects, field_names):
        self.performance_data_options = {}
        if "nagios" in settings.INSTALLED_APPS:
            from nagios.graphbuilder import RRD
            curr_host = Host.objects.get_current()

            try:
                sources = dict()
                sources["performancedata"] = RRD.get_sources_list(
                    curr_host, "Check_CephCluster_{}".format(self.fsid))

                with fsid_context(self.fsid):

                    pools = CephPool.objects.all()
                    if len(pools) > 0:
                        sources["performancedata_pools"] = RRD.get_sources_list(
                            curr_host, "Check_CephPool_{}_{}".format(self.fsid, pools[0].name))

                    try:
                        rbds = CephRbd.objects.all()
                        if len(rbds) > 0:
                            sources["performancedata_rbds"] = RRD.get_sources_list(
                                curr_host, "Check_CephRbd_{}_{}_{}".format(self.fsid, pools[0].name,
                                                                           rbds[0].name))
                    except librados.ExternalCommandError:
                        # Don't break the cluster list, if too many, OSDs are down, as this would
                        # kill our Dashboard.
                        logger.exception('Failed to get RBDs')
                        # pass

                self.performance_data_options = sources

            except SystemError as e:
                logger.error('Set performance_data_options failed: {}'.format(str(e)))

    @staticmethod
    def get_performance_data(fsid, filter=None):
        """
        Returns the performance data for a cluster by the FSID and consideration of the filter
        parameters if given.

        :param fsid: FSID of the cluster
        :rtype: str
        :param filter: The performance data will be filtered by these sources (based on the RRD
            file).
        :rtype: list[str]
        :return: Returns a list of performance data.
        :rtype: dict
        """

        get_object_or_404(CephCluster, fsid=fsid)
        check_for_installed_nagios()

        from nagios.graphbuilder import Graph, RRD
        curr_host = Host.objects.get_current()

        rrd = RRD.get_rrd(curr_host, "Check_CephCluster_{}".format(fsid))
        graph = Graph.get_graph(rrd, filter)
        return Graph.convert_rrdtool_json_to_nvd3(graph.get_json())

    def __str__(self):
        return self.name


@contextmanager
def fsid_context(fsid):
    """
    .. example:
        >>> with fsid_context('baad-food-baadfood') as ctx:
        >>>     print ctx.cluster.name
    """
    class CTX(object):
        def __init__(self, fsid):
            self.cluster = CephCluster.objects.get(fsid=fsid)
            self.fsid = fsid

    ctx = CTX(fsid)
    previous_context = NodbManager.nodb_context
    try:
        NodbManager.set_nodb_context(ctx)
        yield ctx
    finally:
        NodbManager.set_nodb_context(previous_context)


def get_ceph_version(version_file='/usr/bin/ceph', version_variable='CEPH_GIT_NICE_VER'):
    try:
        version_line = [line for line in open(version_file) if line.startswith(version_variable)]
        version = version_line[0].split('=', 1)[1].strip().replace('"', '').split('.')
    except Exception:
        version = [12, 0, 0]

    return version


class CephPool(NodbModel, RadosMixin):

    id = models.IntegerField(primary_key=True, editable=False)
    cluster = models.ForeignKey(CephCluster, editable=False, null=True, blank=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=100, choices=[('replicated', 'replicated'),
                                                     ('erasure', 'erasure')], blank=True)
    erasure_code_profile = models.ForeignKey("CephErasureCodeProfile", null=True, default=None,
                                             blank=True)
    last_change = models.IntegerField(editable=False, blank=True)
    quota_max_objects = models.IntegerField(blank=True)
    quota_max_bytes = models.IntegerField(blank=True)
    full = models.BooleanField(default=None, editable=False)
    pg_num = models.IntegerField(blank=True)
    pgp_num = models.IntegerField(editable=False, blank=True)
    size = models.IntegerField(help_text='Replica size', blank=True, null=True, editable=True)
    min_size = models.IntegerField(help_text='Replica size', blank=True, null=True, editable=True)
    crush_ruleset = models.IntegerField(blank=True)
    crash_replay_interval = models.IntegerField(blank=True)
    num_bytes = models.IntegerField(editable=False, blank=True)
    num_objects = models.IntegerField(editable=False, blank=True)
    max_avail = models.IntegerField(editable=False, blank=True)
    kb_used = models.IntegerField(editable=False, blank=True)
    percent_used = models.FloatField(editable=False, blank=True, default=None)
    stripe_width = models.IntegerField(editable=False, blank=True)
    cache_mode = models.CharField(max_length=100, choices=[(c, c) for c in
                                                           'none|writeback|forward|readonly|'
                                                           'readforward|readproxy'.split(
                                                               '|')], blank=True)
    tier_of = models.ForeignKey("CephPool", null=True, default=None, blank=True,
                                related_name='related_tier_of')
    write_tier = models.ForeignKey("CephPool", null=True, default=None, blank=True,
                                   related_name='related_write_tier')
    read_tier = models.ForeignKey("CephPool", null=True, default=None, blank=True,
                                  related_name='related_read_tier')
    target_max_bytes = models.IntegerField(blank=True)
    hit_set_period = models.IntegerField(blank=True)
    hit_set_count = models.IntegerField(blank=True)
    hit_set_params = JsonField(base_type=dict, editable=False, blank=True)
    tiers = JsonField(base_type=list, editable=False, blank=True)
    flags = JsonField(base_type=list, blank=True, default=[])

    pool_snaps = JsonField(base_type=list, editable=False, blank=True)

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        result = []
        fsid = context.cluster.fsid

        osd_dump_data = RadosMixin.mon_api(fsid).osd_dump()

        for pool_data in osd_dump_data['pools']:

            pool_id = pool_data['pool']

            object_data = {
                'id': pool_id,
                'cluster_id': fsid,
                'name': pool_data['pool_name'],
                'type': {1: 'replicated', 3: 'erasure'}[pool_data['type']],  # type is an
                                                                             # undocumented dump of
                # https://github.com/ceph/ceph/blob/289c10c9c79c46f7a29b5d2135e3e4302ac378b0/src/osd/osd_types.h#L1035
                'erasure_code_profile_id':
                    (pool_data['erasure_code_profile'] if pool_data['erasure_code_profile'] else None),
                'last_change': pool_data['last_change'],
                'full': 'full' in pool_data['flags_names'],
                'min_size': pool_data['min_size'],
                'crash_replay_interval': pool_data['crash_replay_interval'],
                'pg_num': pool_data['pg_num'],
                'size': pool_data['size'],
                'crush_ruleset': pool_data[
                    # Cope with API breakage at https://github.com/ceph/ceph/commit/07abacb2e4bde6cb7f9e44879e743bc91bc4b085
                    'crush_rule' if 'crush_rule' in pool_data else 'crush_ruleset'],
                # Considered advanced options
                'pgp_num': pool_data['pg_placement_num'],
                'stripe_width': pool_data['stripe_width'],
                'quota_max_bytes': pool_data['quota_max_bytes'],
                'quota_max_objects': pool_data['quota_max_objects'],
                # Cache tiering related
                'cache_mode': pool_data['cache_mode'],
                'tier_of_id': pool_data['tier_of'] if pool_data['tier_of'] > 0 else None,
                'write_tier_id': pool_data['write_tier'] if pool_data['write_tier'] > 0 else None,
                'read_tier_id': pool_data['read_tier'] if pool_data['read_tier'] > 0 else None,
                # Attributes for cache tiering
                'target_max_bytes': pool_data['target_max_bytes'],
                'hit_set_period': pool_data['hit_set_period'],
                'hit_set_count': pool_data['hit_set_count'],
                'hit_set_params': pool_data['hit_set_params'],
                'tiers': pool_data['tiers'],
                'flags': pool_data['flags_names'].split(','),
                'pool_snaps': pool_data['pool_snaps'],
            }

            ceph_pool = CephPool(**CephPool.make_model_args(object_data))

            result.append(ceph_pool)

        return result

    @bulk_attribute_setter(['max_avail', 'kb_used', 'percent_used'])
    def ceph_df(self, pools, field_names):
        fsid = self.cluster.fsid
        df_data = self.mon_api(fsid).df()
        df_per_pool = {
            elem['id']: elem['stats']
            for elem
            in df_data['pools']
            if 'stats' in elem and 'id' in elem
        }

        for pool in pools:
            if pool.id in df_per_pool:
                pool.max_avail = df_per_pool[pool.id]['max_avail']
                pool.kb_used = df_per_pool[pool.id]['kb_used']
                pool.percent_used = self._calc_percent_used(pool, df_data['stats'], df_per_pool[pool.id])
            else:
                pool.max_avail = None
                pool.kb_used = None
                pool.percent_used = None

    @bulk_attribute_setter(['num_bytes', 'num_objects'],
                           catch_exceptions=librados.rados.ObjectNotFound)
    def set_stats(self, pools, field_names):
        stats = call_librados(self.cluster.fsid, lambda client: client.get_stats(self.name))
        self.num_bytes = stats['num_bytes'] if 'num_bytes' in stats else None
        self.num_objects = stats['num_objects'] if 'num_objects' in stats else None

    @staticmethod
    def _calc_percent_used(pool, df_data_global, df_data_pool):
        if df_data_pool['bytes_used'] == 0:
            return 0

        # Calculate the current object copies rate
        if pool.type == 'replicated':
            curr_object_copies_rate = df_data_pool['raw_bytes_used'] / (df_data_pool['bytes_used'] * pool.size)
        else:
            curr_object_copies_rate = df_data_pool['raw_bytes_used'] / (df_data_pool['bytes_used'] * (
                (pool.erasure_code_profile.m + pool.erasure_code_profile.k) / pool.erasure_code_profile.k))

        # Get the current Ceph version because there are different formulas for the calculation of the %used in the
        # Jewel and Luminous releases
        version = get_ceph_version()

        # Calculate the %used value
        if int(version[0]) >= 12:
            # Luminous release
            return df_data_pool['bytes_used'] * 100 * curr_object_copies_rate / (df_data_pool['bytes_used'] +
                                                                                 df_data_pool['max_avail'])
        else:
            # Jewel release
            return df_data_pool['bytes_used'] * 100 * curr_object_copies_rate / df_data_global['total_bytes']

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
        insert = getattr(self, 'id', None) is None
        with undo_transaction(self.mon_api(), exception_type=(ExternalCommandError, NotSupportedError),
                              re_raise_exception=True) as api:
            if insert:
                api.osd_pool_create(self.name,
                                    self.pg_num,
                                    self.pg_num,
                                    # second pg_num is in fact pgp_num, but we don't want to allow
                                    # different values here.
                                    self.type,
                                    self.erasure_code_profile.name if self.erasure_code_profile
                                    else None)

            diff, original = (self.get_modified_fields(name=self.name) if insert else
                              self.get_modified_fields())
            self.set_read_only_fields(original)
            if insert:
                for attr, value in diff.items():
                    if not hasattr(self, attr):
                        setattr(self, attr, value)
                self._task_queue = ceph.tasks.track_pg_creation.delay(context.fsid, self.id, 0,
                                                                      self.pg_num)

            def schwartzian_transform(obj):
                key, val = obj
                if key == 'tier_of_id':
                    return (1 if val is None else -1), obj  # move to start or end.
                return 0, obj

            for key, value in sorted(diff.items(), key=schwartzian_transform):
                if key == 'pg_num':
                    if not insert:
                        api.osd_pool_set(self.name, "pg_num", value,
                                         undo_previous_value=original.pg_num)
                        api.osd_pool_set(self.name, "pgp_num", value,
                                         undo_previous_value=original.pg_num)
                elif key == 'cache_mode':
                    api.osd_tier_cache_mode(self.name, value,
                                            undo_previous_mode=original.cache_mode)
                elif key == 'tier_of_id':
                    if self.tier_of is None:
                        tier_of_target = original.tier_of
                        api.osd_tier_remove(tier_of_target.name, self.name)
                    else:
                        tier_of_target = self.tier_of
                        api.osd_tier_add(tier_of_target.name, self.name)
                elif key == 'read_tier_id':
                    if self.read_tier is None:
                        read_tier_target = original.read_tier
                        api.osd_tier_remove_overlay(self.name,
                                                    undo_previous_overlay=read_tier_target.name)
                    else:
                        read_tier_target = self.read_tier
                        api.osd_tier_set_overlay(self.name, read_tier_target.name)
                elif key == 'flags':
                    for flag in value:
                        if flag == 'allow_ec_overwrites' or flag == 'ec_overwrites':
                            api.osd_pool_set(self.name, 'allow_ec_overwrites', 'true')
                        else:
                            msg = 'Unknown flag \'{}\'.'.format(flag)
                            logger.warning(msg)
                            raise NotSupportedError(msg)
                elif self.type == 'replicated' and key not in ['name'] and value is not None:
                    api.osd_pool_set(self.name, key, value, undo_previous_value=getattr(original,
                                                                                        key))
                elif self.type == 'erasure' and key not in ['name', 'size', 'min_size'] and value is not None:
                    api.osd_pool_set(self.name, key, value, undo_previous_value=getattr(original,
                                                                                        key))
                else:
                    logger.warning('Tried to set "{}" to "{}" on pool "{}" aka "{}", which is not '
                                   'supported'.format(key, value, self.id, self.name))

            super(CephPool, self).save(*args, **kwargs)
            self._update_nagios_configs()

    def delete(self, using=None):
        api = self.mon_api()
        api.osd_pool_delete(self.name, self.name, "--yes-i-really-really-mean-it")
        self._update_nagios_configs()

    def create_snapshot(self, name):
        api = self.mon_api()
        api.osd_pool_mksnap(self.name, name)

    def delete_snapshot(self, name):
        api = self.mon_api()
        api.osd_pool_rmsnap(self.name, name)

    def _update_nagios_configs(self):
        if "nagios" in settings.INSTALLED_APPS:
            ceph = get_dbus_object("/ceph")
            nagios = get_dbus_object("/nagios")

            ceph.remove_nagios_configs(["pool"])
            ceph.write_pool_nagios_configs()
            nagios.restart_service()

    @staticmethod
    def get_performance_data(fsid, filter=None):
        """
        Returns the performance data for a pool by the FSID and consideration of the filter
        parameters if given.

        :param fsid: FSID of the cluster
        :rtype: str
        :param filter: The performance data will be filtered by these sources (based on the RRD
            file).
        :rtype: dict["filter_pools": list[str], "filter_sources": list[str]]
        :return: Returns a list of performance data.
        :rtype: dict
        """

        get_object_or_404(CephCluster, fsid=fsid)
        check_for_installed_nagios()

        from nagios.graphbuilder import Graph, RRD
        curr_host = Host.objects.get_current()

        pools = []
        with fsid_context(fsid):
            if filter["filter_pools"]:
                for filter_pool in filter["filter_pools"]:
                    pools.append(CephPool.objects.get(name=filter_pool))
            else:
                pools = CephPool.objects.all()

        perf_data_results = dict()
        for pool in pools:
            pool_rrd = RRD.get_rrd(curr_host, "Check_CephPool_{}_{}".format(fsid, pool.name))
            graph = Graph.get_graph(pool_rrd, filter["filter_sources"])
            perf_data_results[pool.name] = Graph.convert_rrdtool_json_to_nvd3(graph.get_json())
        return perf_data_results


class CephErasureCodeProfile(NodbModel, RadosMixin):
    name = models.CharField(max_length=100, primary_key=True)
    k = models.IntegerField()
    m = models.IntegerField()
    plugin = models.CharField(max_length=100, editable=False)
    technique = models.CharField(max_length=100, editable=False)
    jerasure_per_chunk_alignment = models.CharField(max_length=100, editable=False)
    ruleset_failure_domain = models.CharField(max_length=100, blank=True)
    ruleset_root = models.CharField(max_length=100, editable=False)
    w = models.IntegerField(editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        api = RadosMixin.mon_api(context.fsid)
        profiles = [CephErasureCodeProfile(name=profile)
                    for profile in api.osd_erasure_code_profile_ls()]
        for profile in profiles:
            setattr(profile, '_context', context)
        return profiles

    @bulk_attribute_setter(['k', 'm', 'plugin', 'technique', 'jerasure_per_chunk_alignment',
                           'ruleset_failure_domain', 'ruleset_root', 'w'],
                           catch_exceptions=librados.ExternalCommandError)
    def set_data(self, objects, field_names):
        context = self.get_context()
        api = self.mon_api(context.fsid)

        model_args = CephErasureCodeProfile.make_model_args(
                api.osd_erasure_code_profile_get(self.name),
                fields_force_none=field_names).items()

        for field_name, value in model_args:
            setattr(self, field_name, value)

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        context = self.get_context()
        api = self.mon_api(context.fsid)

        if not force_insert:
            raise NotImplementedError('Updating is not supported.')
        profile = ['k={}'.format(self.k), 'm={}'.format(self.m)]
        if self.ruleset_failure_domain:
            profile.append('ruleset-failure-domain={}'.format(self.ruleset_failure_domain))
        try:
            api.osd_erasure_code_profile_set(self.name, profile)
        except librados.ExternalCommandError as e:  # TODO, I'm a bit unsatisfied with this catching
            # ExternalCommandError here, but ExternalCommandError should default to an
            # internal server error.
            logger.exception('Failed to create ECP')
            raise NotSupportedError(e)

    def delete(self, using=None):
        context = self.get_context()
        api = self.mon_api(context.fsid)
        try:
            api.osd_erasure_code_profile_rm(self.name)
        except librados.ExternalCommandError as e:  # TODO, I'm a bit unsatisfied with this catching
            # ExternalCommandError here, but ExternalCommandError should default to an
            # internal server error.
            logger.exception('Failed to delete ECP')
            raise NotSupportedError(e)

    def get_context(self):
        try:
            return self._context
        except AttributeError:
            return self.__class__.objects.nodb_context

    def __unicode__(self):
        return self.name


class CephOsd(NodbModel, RadosMixin):
    id = models.IntegerField(primary_key=True, editable=False)
    crush_weight = models.FloatField()
    exists = models.IntegerField(editable=False)
    name = models.CharField(max_length=100, editable=False)
    primary_affinity = models.FloatField()
    reweight = models.FloatField()
    status = models.CharField(max_length=100, editable=False)
    type = models.CharField(max_length=100, editable=False)
    hostname = models.CharField(max_length=256, editable=False)
    in_state = models.IntegerField()
    osd_objectstore = models.CharField(max_length=15, editable=False, null=True)

    # from pg dump
    kb = models.IntegerField(editable=False)
    kb_used = models.IntegerField(editable=False)
    kb_avail = models.IntegerField(editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        api = RadosMixin.mon_api(context.fsid)
        osd_tree = api.osd_list() # key=id
        osd_dump_data = api.osd_dump()['osds']  # key=osd
        pg_dump_data = api.pg_dump()['osd_stats']  # key=osd
        osd_metadata = api.osd_metadata()  # key=id
        fields_to_force = ['primary_affinity']
        zipped_data = zip_by_keys(('id', osd_tree),
                                  ('osd', osd_dump_data),
                                  ('osd', pg_dump_data),
                                  ('id', osd_metadata))
        return [CephOsd(
            **CephOsd.make_model_args(dict(in_state=data['in'] if 'in' in data else 0, **data),
                                      fields_force_none=fields_to_force))
                for data
                in zipped_data]

    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Ceph state-machine in a sane way.
        3. Providing a RESTful API.
        """
        context = CephPool.objects.nodb_context
        api = self.mon_api(context.fsid)

        if self.id is None:
            raise ValidationError('Creating OSDs is not supported.')
        with undo_transaction(api, re_raise_exception=True) as api:
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

    def __unicode__(self):
        return getattr(self, 'name', unicode(self.pk))


class CephPg(NodbModel, RadosMixin):

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
    state = models.CharField(
        max_length=100, help_text='http://docs.ceph.com/docs/master/rados/operations/pg-states/')
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
            if query.q is None or len(query.q.children) != 1 or len(query.q.children[0]) != 2:
                return argdict
            if query.q.children[0][0] not in mapping.keys():
                return argdict

            return {mapping[query.q.children[0][0]]: str(query.q.children[0][1])}

        def get_command():
            mapping = {
                'osd_id__exact': 'pg ls-by-osd',
                'pool_name__exact': 'pg ls-by-pool'
            }

            if query.q is None or len(query.q.children) != 1 or len(query.q.children[0]) != 2:
                return 'pg ls'
            if query.q.children[0][0] not in mapping.keys():
                return 'pg ls'

            return mapping[query.q.children[0][0]]
        return get_command(), get_argdict()

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        cmd, argdict = CephPg.get_mon_command_by_query(query)
        try:
            pgs = call_librados(context.fsid, lambda client: client.mon_command(cmd, argdict, default_return=[]))
        except librados.ExternalCommandError, e:
            logger.exception('failed to get pgs: "%s" "%s" "%s"', cmd, argdict, e)
            return []

        ret = []
        for pg in pgs:
            fields_to_force = ['last_became_active', 'last_became_peered', 'last_active',
                               'last_change', 'last_deep_scrub', 'last_scrub',
                               'last_clean_scrub_stamp', 'last_clean', 'last_fresh',
                               'last_fullsized', 'last_peered', 'last_undegraded', 'last_unstale',
                               'osd_id', 'pool_name']
            model_args = CephPg.make_model_args(pg, fields_force_none=fields_to_force)
            if 'osd' in argdict:
                model_args['osd_id'] = argdict['osd']
            if 'poolstr' in argdict:
                model_args['pool_name'] = argdict['poolstr']

            ret.append(CephPg(**model_args))
        return ret


class CephRbd(NodbModel, RadosMixin):  # aka RADOS block device
    """
    See http://tracker.ceph.com/issues/15448
    """
    id = models.CharField(max_length=100, primary_key=True, editable=False,
                          help_text='pool-name/image-name')
    name = models.CharField(max_length=100)
    pool = models.ForeignKey(CephPool)
    size = models.IntegerField(help_text='Bytes, where size modulo obj_size === 0',
                               default=4 * 1024 ** 3)
    obj_size = models.IntegerField(null=True, blank=True, help_text='obj_size === 2^n',
                                   default=2 ** 22)
    num_objs = models.IntegerField(editable=False)
    block_name_prefix = models.CharField(max_length=100, editable=False)
    features = JsonField(base_type=list, null=True, blank=True,
                         help_text='For example: [{}]'.format(
                             ', '.join(['"{}"'.format(v) for v
                                        in RbdApi.get_feature_mapping().values()])))
    old_format = models.BooleanField(default=False, help_text='should always be false')
    used_size = models.IntegerField(editable=False)
    stripe_unit = models.IntegerField(blank=True, null=True)
    stripe_count = models.IntegerField(blank=True, null=True)

    def __init__(self, *args, **kwargs):
        super(CephRbd, self).__init__(*args, **kwargs)

    @staticmethod
    def make_key(pool, image_name):
        """
        :type pool: CephPool
        :type image_name: str | unicode
        :rtype: unicode
        """
        return u'{}/{}'.format(pool.name, image_name)

    @staticmethod
    def get_all_objects(context, query):
        assert context is not None
        api = RadosMixin.rbd_api(context.fsid)

        pools = CephPool.objects.all()
        rbd_name_pools = (itertools.chain.from_iterable((((image, pool)
                                                          for image in api.list(pool.name))
                                                         for pool in pools)))
        rbds = ((aggregate_dict(api.image_stat(pool.name, image_name),
                                old_format=api.image_old_format(pool.name, image_name),
                                features=api.image_features(pool.name, image_name),
                                name=image_name,
                                pool_id=pool.id),
                 pool)
                for (image_name, pool)
                in rbd_name_pools)

        return [CephRbd(**CephRbd.make_model_args(aggregate_dict(
            rbd, pool=pool, id=CephRbd.make_key(pool, rbd['name'])))) for (rbd, pool) in rbds]

    @bulk_attribute_setter(['used_size'])
    def set_disk_usage(self, objects, field_names):
        self.used_size = None

        if self.features is None or 'fast-diff' in self.features:
            fsid = self.pool.cluster.fsid
            pool_name = self.pool.name

            if len(TaskQueue.filter_by_definition_and_status(
                    ceph.tasks.get_rbd_performance_data(fsid, pool_name, self.name),
                    [TaskQueue.STATUS_NOT_STARTED, TaskQueue.STATUS_RUNNING])) == 0:
                ceph.tasks.get_rbd_performance_data.delay(fsid, pool_name, self.name)

            tasks = TaskQueue.filter_by_definition_and_status(
                ceph.tasks.get_rbd_performance_data(fsid, pool_name, self.name),
                [TaskQueue.STATUS_FINISHED, TaskQueue.STATUS_EXCEPTION, TaskQueue.STATUS_ABORTED])
            tasks = list(tasks)
            disk_usage = dict()

            if len(tasks) > 0:
                latest_task = tasks.pop()

                for task in tasks:
                    task.delete()

                if latest_task.status not in [TaskQueue.STATUS_EXCEPTION, TaskQueue.STATUS_ABORTED]:
                    disk_usage, _exec_time = latest_task.json_result

            if 'used_size' in disk_usage:
                self.used_size = disk_usage['used_size']

    @bulk_attribute_setter(['stripe_unit', 'stripe_count'])
    def set_stripe_info(self, objects, field_names):
        if 'stripingv2' in self.features:
            api = RadosMixin.rbd_api(self.pool.cluster.fsid)

            self.stripe_count, self.stripe_unit = api.image_stripe_info(self.pool.name, self.name)
        else:
            self.stripe_count = None
            self.stripe_unit = None

    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Ceph state-machine in a sane way.
        3. Providing a RESTful API.
        """
        insert = self._state.adding  # there seems to be no id field.
        if not hasattr(self, 'features') or self.features == u'':
            self.features = None

        api = self.rbd_api()

        with undo_transaction(api, re_raise_exception=True,
                              exception_type=CephRbd.DoesNotExist):

            if insert:
                order = None
                if self.obj_size is not None and self.obj_size > 0:
                    order = int(round(math.log(float(self.obj_size), 2)))
                api.create(self.pool.name, self.name, self.size, features=self.features,
                           old_format=self.old_format, order=order,
                           stripe_unit=self.stripe_unit, stripe_count=self.stripe_count)
                self.id = CephRbd.make_key(self.pool, self.name)

            diff, original = self.get_modified_fields()
            self.set_read_only_fields(original)

            if insert:
                self.features = original.features

            for key, value in diff.items():
                if key == 'size':
                    assert not insert
                    api.image_resize(self.pool.name, self.name, value)
                elif key == 'features':
                    if not insert:
                        for feature in set(original.features).difference(set(value)):
                            api.image_set_feature(self.pool.name, self.name, feature, False)
                        for feature in set(value).difference(set(original.features)):
                            api.image_set_feature(self.pool.name, self.name, feature, True)
                    else:
                        logger.warning('Tried to set features, but they should already match. {} '
                                       '!= {}'.format(original.features, value))
                else:
                    logger.warning('Tried to set "{}" to "{}" on rbd "{}", which is not '
                                   'supported'.format(key, value, self.name))

            super(CephRbd, self).save(*args, **kwargs)
            self._update_nagios_configs()

    def delete(self, using=None):
        try:
            if iSCSITarget:
                targets = iSCSITarget.objects.all().filter(images__name=self.name).count()
                if targets > 0:
                    raise Exception('There are iSCSI targets using image {}'.format(self.name))
        except RequestException:
            logger.debug('Salt-API is not available to check for iSCSI targets')

        api = self.rbd_api()
        api.remove(self.pool.name, self.name)
        self._update_nagios_configs()

    def _update_nagios_configs(self):
        if "nagios" in settings.INSTALLED_APPS:
            ceph = get_dbus_object("/ceph")
            nagios = get_dbus_object("/nagios")

            ceph.remove_nagios_configs(["rbd"])
            ceph.write_rbd_nagios_configs()
            nagios.restart_service()

    @staticmethod
    def get_performance_data(rbd, filter=None):
        """
        Returns the performance data for a RBD by consideration of the filter parameters if given.

        :param rbd: RBD object
        :type rbd: CephRbd
        :param filter: The performance data will be filtered by these sources (based on the RRD
            file).
        :type filter: list[str]
        :return: Returns a list of performance data.
        :rtype: dict
        """

        check_for_installed_nagios()

        from nagios.graphbuilder import Graph, RRD
        curr_host = Host.objects.get_current()

        rrd = RRD.get_rrd(curr_host, "Check_CephRbd_{}_{}_{}".format(
            rbd.pool.cluster.fsid, rbd.pool.name, rbd.name))

        graph = Graph.get_graph(rrd, filter)
        perf_data = Graph.convert_rrdtool_json_to_nvd3(graph.get_json())
        return perf_data


class CephFs(NodbModel, RadosMixin):
    name = models.CharField(max_length=100, primary_key=True)
    metadata_pool = models.ForeignKey(CephPool, related_name='metadata_of_ceph_fs')
    data_pools = JsonField(base_type=list)

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        api = RadosMixin.mon_api(context.fsid)


        ret = []
        for fs in api.fs_ls():
            args = CephFs.make_model_args(fs)
            args['data_pools'] = fs['data_pool_ids']
            args['metadata_pool_id'] = fs['metadata_pool_id']
            ret.append(CephFs(**args))

        return ret

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        api = RadosMixin.mon_api()
        insert = self._state.adding
        if not insert:
            raise NotImplementedError('Updating is not supported.')
        data_pool = CephPool.objects.get(id=self.data_pools[0])
        api.fs_new(self.name, self.metadata_pool.name, data_pool.name)

    def delete(self, using=None):
        api = RadosMixin.mon_api()
        api.fs_rm(self.name, '--yes-i-really-mean-it')


class CrushmapVersion(NodbModel):

    crushmap = JsonField(base_type=dict)

    @staticmethod
    def get_all_objects(context, query):
        """:type context: ceph.restapi.FsidContext"""
        assert context is not None
        fsid = context.cluster.fsid
        crushmap = RadosMixin.mon_api(fsid).osd_crush_dump()
        return [CrushmapVersion(id=1, crushmap=crushmap)]

    def get_tree(self):
        """Get the (slightly modified) CRUSH tree.

        Returns the CRUSH tree for the cluster. The `items` array of the `buckets` are modified so
        that they don't contain the OSDs anymore, but the children buckets.
        """

        crushtree = dict(self.crushmap, buckets=[])

        parentbucket = {}

        for cbucket in self.crushmap["buckets"]:

            for member in cbucket["items"]:
                # Creates an array with all children using their IDs as keys and themselves as
                # values. This already excludes the root buckets!
                parentbucket[member["id"]] = cbucket

            # Clears the items of `crushmap['buckets']`.
            cbucket["items"] = []

        buckets = self.crushmap["buckets"][:]  # Make a copy of the `buckets` array.
        while buckets:
            cbucket = buckets.pop(0)

            if cbucket["id"] in parentbucket:  # If the current bucket has a parent.

                # Add the child (cbucket) to the `items` array of the parent object.
                parentbucket[cbucket["id"]]["items"].append(cbucket)

            else:  # Has to be a root bucket.

                # Add the root bucket to the `buckets` array. It would be empty otherwise!
                crushtree["buckets"].append(cbucket)

        return crushtree


def check_for_installed_nagios():
    if "nagios" not in settings.INSTALLED_APPS:
        raise NotSupportedError("Nagios does not appear to be installed, no performance data could "
                                "be returned.")
