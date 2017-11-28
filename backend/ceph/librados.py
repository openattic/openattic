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
import subprocess
from StringIO import StringIO
from collections import deque
from contextlib import contextmanager
import fnmatch
from errno import EPERM
from configobj import ConfigObj
import os
import json
import glob
import logging
import ConfigParser

from django.conf import settings as django_settings

import rados
import rbd

import oa_settings
from ceph.conf import settings
from exception import ExternalCommandError
from utilities import run_in_external_process, write_single_setting

logger = logging.getLogger(__name__)


def _write_oa_setting(key, value):
    conf_obj = write_single_setting(key, value)

    # Added in 3.5.1: Remove old and broken keys containing '-'.
    for pattern in ['CEPH_KEYRING_*', 'CEPH_KEYRING_USER_*']:
        old_keys = [k for k in fnmatch.filter(conf_obj.keys(), pattern) if '-' in k]
        if old_keys:
            logger.warning('Removing old keys {}'.format(old_keys))
            oa_settings.save_settings_generic(old_keys, lambda _: '', lambda _: str, lambda _: '')

    clients.clear()


def _read_oa_settings(conf_obj, settings_obj):
    """
    >>> obj = type('_', (object, ), {})()  # create dummy object
    >>> _read_oa_settings({
    ...     'CEPH_CLUSTERS': '/etc/ceph/ceph.conf',
    ...     'CEPH_KEYRING_F_S_I_D': '/etc/ceph/keyring',
    ...     'CEPH_KEYRING_USER_F-S-I-D': 'replace minus with underscore',
    ... }, obj)
    >>> obj.CEPH_CLUSTERS
    '/etc/ceph/ceph.conf'
    >>> obj.CEPH_KEYRING_F_S_I_D
    '/etc/ceph/keyring'
    >>> obj.CEPH_KEYRING_USER_F_S_I_D
    'replace minus with underscore'
    >>> getattr(obj, 'CEPH_KEYRING_USER_F-S-I-D', '<unset>')
    '<unset>'
    """
    for pattern in ['CEPH_CLUSTERS', 'CEPH_KEYRING_*', 'CEPH_KEYRING_USER_*']:
        for key in fnmatch.filter(conf_obj.keys(), pattern):  # type: str
            logger.info(
                '{} {} {}'.format(key, getattr(settings_obj, key, '<unset>'), conf_obj[key]))
            old_key = key
            if '-' in key:
                logger.warning('found old key {}'.format(old_key))
            key = key.replace('-', '_')
            setattr(settings_obj, key, conf_obj[old_key])

    clients.clear()


class _ClusterSettingsListener(oa_settings.SettingsListener):

    def settings_changed_handler(self):
        _read_oa_settings(ConfigObj(oa_settings.settings_file), django_settings)


_clusterSettingsListener = _ClusterSettingsListener()


def sort_by_prioritized_users(elem):
    """
    Priorities:
    1. string that contains openattic
    2. string that contains admin
    3. everything else

    >>> sorted(['foo', 'client.admin', 'baz', 'client.openattic', 'baz'],
    ...        key=sort_by_prioritized_users)
    ['client.openattic', 'client.admin', 'baz', 'baz', 'foo']
    """
    if 'openattic' in elem:
        return 0, elem
    if 'admin' in elem:
        return 1, elem
    return 2, elem


class ClusterConf(object):
    def __init__(self, file_path):
        """:type file_path: str | unicode"""
        self.file_path = file_path

    def is_valid(self):
        if not os.path.exists(self.file_path):
            logger.error("No Ceph cluster configuration file '{}' found".format(self.file_path))
            return False

        if not os.access(self.file_path, os.R_OK):
            logger.error("Ceph configuration file '{}' is not accessible, permission denied"
                         .format(self.file_path))
            return False

        return True

    @property
    def config_parser(self):
        cp = ConfigParser.RawConfigParser()
        with open(self.file_path) as f:
            cp.readfp(StringIO('\n'.join(line.strip() for line in f)))
        return cp

    @property
    def name(self):
        return os.path.basename(os.path.splitext(self.file_path)[0])

    @property
    def fsid(self):
        return self.config_parser.get('global', 'fsid')

    @property
    def keyring_file_path(self):
        try:
            return getattr(django_settings, 'CEPH_KEYRING_' + self.fsid.upper().replace('-', '_'))
        except AttributeError:
            candidates = self.keyring_candidates
            return candidates[0].file_name if candidates else ''

    @keyring_file_path.setter
    def keyring_file_path(self, file_path):
        if self.keyring_file_path != file_path:
            _write_oa_setting('CEPH_KEYRING_' + self.fsid.upper().replace('-', '_'), file_path)

    @property
    def keyring(self):
        user_name = getattr(django_settings,
                            'CEPH_KEYRING_USER_' + self.fsid.upper().replace('-', '_'), None)
        return Keyring(self.keyring_file_path, user_name)

    @property
    def keyring_candidates(self):
        """
        According to http://docs.ceph.com/docs/master/rados/configuration/auth-config-ref/#keys
        :rtype: list[Keyring]
        """
        keyrings = glob.glob('/etc/ceph/{}.*.keyring'.format(self.name))
        keyrings += glob.glob('/etc/ceph/{}.keyring'.format(self.name))
        keyrings += glob.glob('/etc/ceph/keyring')
        keyrings += glob.glob('/etc/ceph/keyring.bin')
        for section in self.config_parser.sections():
            if section.startswith('client'):
                try:
                    keyrings.append(self.config_parser.get(section, 'keyring'))
                except ConfigParser.NoOptionError:
                    pass

        def keyring_or_none(file_path):
            try:
                keyring = Keyring(file_path)
                keyring._check_access()
                return keyring
            except RuntimeError:
                return None

        keyrings = filter(None, map(keyring_or_none, set(keyrings)))
        return sorted(keyrings, key=lambda keyring: sort_by_prioritized_users(keyring.user_name))

    @property
    def client(self):
        return Client(self.file_path, self.keyring)

    @classmethod
    def all_configs(cls):
        configs = set(glob.glob('/etc/ceph/*.conf'))
        if hasattr(django_settings, 'CEPH_CLUSTERS'):
            configs = configs.union(django_settings.CEPH_CLUSTERS.split(';'))

        known_fsids = set()
        for conf_file in configs:
            conf = cls(conf_file)
            if conf.is_valid() and conf.fsid not in known_fsids:
                known_fsids.add(conf.fsid)
                yield conf

    @classmethod
    def from_fsid(cls, fsid):
        for c in cls.all_configs():
            if c.fsid == fsid:
                return c
        raise LookupError('Unknown cluster {}'.format(fsid))


class Keyring(object):
    """
    Returns usable keyring
    """
    def __init__(self, file_name, user_name=None):
        """
        Sets keyring filename and username
        :type file_name: str | unicode
        :type user_name: str | unicode | None
        """
        self.file_name = file_name
        self.user_name = user_name
        self.available_user_names = None  # type: list

        self._usernames()
        logger.debug("Connecting as {}".format(self.user_name))

    def _check_access(self):
        """
        Check permissions on keyring.
        """
        if not self.file_name:
            raise RuntimeError("No valid keyring file found")

        if not os.path.isfile(self.file_name):
            raise RuntimeError("Keyring does not exist: {}".format(self.file_name))

        if not os.access(self.file_name, os.R_OK):
            raise RuntimeError("Check keyring permissions: {}".format(self.file_name))

        if not self.user_name:
            error_msg = "Corrupt keyring, check {}".format(self.file_name)
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        if self.user_name not in self.available_user_names:
            raise RuntimeError(
                'Keyring {} does not contain user {}'.format(self.file_name, self.user_name))

    def _usernames(self):
        """
        Parse keyring for username
        """
        _config = ConfigParser.ConfigParser()
        try:
            _config.read(self.file_name)
        except ConfigParser.ParsingError:
            # ConfigParser fails on leading whitespace for keys
            pass

        try:
            self.available_user_names = sorted(_config.sections(), key=sort_by_prioritized_users)
            if self.user_name is None:
                self.user_name = self.available_user_names[0]
        except IndexError:
            return

    def set_user_name(self, fsid, user_name):
        if self.user_name != user_name:
            _write_oa_setting('CEPH_KEYRING_USER_' + fsid.upper().replace('-', '_'), user_name)

    def __repr__(self):
        return "Keyring(file_name='{}', user_name='{}')".format(self.file_name, self.user_name)


class Client(object):
    """Represents the connection to a single ceph cluster."""

    def __init__(self, file_path, keyring):
        """:type keyring: Keyring"""
        self._conf_file = file_path
        self._keyring = keyring.file_name
        self._name = keyring.user_name
        self._pools = {}
        """:type _pools: dict[str, rados.Ioctx]"""
        self._cluster = None
        """:type _cluster: rados.Rados"""
        self._default_timeout = 30
        self.connect(self._conf_file)

    def get_pool(self, pool_name):
        if pool_name not in self._pools:
            self._pools[pool_name] = self._cluster.open_ioctx(pool_name)
        self._pools[pool_name].require_ioctx_open()

        return self._pools[pool_name]

    def connect(self, conf_file):
        if self._cluster is None:
            self._cluster = rados.Rados(conffile=conf_file, name=self._name,
                                        conf={'keyring': self._keyring})

        if not self.connected():
            self._cluster.connect()

        return self._cluster

    def disconnect(self):
        for pool_name, pool in self._pools.items():
            if pool and pool.close:
                pool.close()

        if self.connected():
            self._cluster.shutdown()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def connected(self):
        return self._cluster and self._cluster.state == 'connected'

    def get_cluster_stats(self):
        return self._cluster.get_cluster_stats()

    def get_fsid(self):
        return self._cluster.get_fsid()

    def list_pools(self):
        return self._cluster.list_pools()

    def create_pool(self, pool_name, auid=None, crush_rule=None):
        return self._cluster.create_pool(pool_name, auid=auid, crush_rule=crush_rule)

    def pool_exists(self, pool_name):
        return self._cluster.pool_exists(pool_name)

    def delete_pool(self, pool_name):
        return self._cluster.delete_pool(pool_name)

    def get_stats(self, pool_name):
        return self.get_pool(pool_name).get_stats()

    def change_pool_owner(self, pool_name, auid):
        return self.get_pool(pool_name).change_auid(auid)

    def mon_command(self, cmd, argdict=None, output_format='json', default_return=None,
                    target=None):
        """Calls a monitor command and returns the result as dict.

        If `cmd` is a string, it'll be used as the argument to 'prefix'. If `cmd` is a dict
        otherwise, it'll be used directly as input for the mon_command and you'll have to specify
        the 'prefix' argument yourself.

        :param cmd: the command
        :type cmd: str | dict[str, Any]
        :param argdict: Additional Command-Parameters
        :type argdict: dict[str, Any]
        :param output_format: Format of the return value
        :type output_format: str
        :param default_return: Return value in case of an error - if the answer given by Ceph
                               cluster can't be Json
            decoded (only for output_format='json')
        :type default_return: any
        :return: Return type is json (aka dict) if output_format == 'json' else str.
        :rtype: str | dict[str, Any]

        :raises ExternalCommandError: The command failed with an error code instead of an exception.
        :raises PermissionError: See rados.make_ex
        :raises ObjectNotFound: See rados.make_ex
        :raises IOError: See rados.make_ex
        :raises NoSpace: See rados.make_ex
        :raises ObjectExists: See rados.make_ex
        :raises ObjectBusy: See rados.make_ex
        :raises NoData: See rados.make_ex
        :raises InterruptedOrTimeoutError: See rados.make_ex
        :raises TimedOut: See rados.make_ex
        """

        if type(cmd) is str:
            return self.mon_command(
                {'prefix': cmd}, argdict, output_format, default_return, target)

        elif type(cmd) is dict:
            (ret, out, err) = self._cluster.mon_command(
                json.dumps(dict(cmd,
                                format=output_format,
                                **argdict if argdict is not None else {})),
                '',
                timeout=self._default_timeout,
                target=target)
            logger.debug('mod command {}, {}, {}'.format(cmd, argdict, err))
            if ret == 0:
                if output_format == 'json':
                    if out:
                        return json.loads(out)
                    else:
                        logger.warning("Returned default value '{}' for command '{}' because the "
                                       "JSON object of the Ceph cluster's command output '{}' "
                                       "couldn't be decoded."
                                       .format(default_return, cmd, out))
                        return default_return
                return out
            else:
                raise ExternalCommandError(err, cmd, argdict, code=ret)


class ClientManager(object):

    instances = {}

    def __getitem__(self, fsid):
        """
        :type fsid: str | unicode
        :rtype: librados.Client
        """
        if fsid not in self.instances:
            self.instances[fsid] = ClusterConf.from_fsid(fsid).client

        return self.instances[fsid]

    def clear(self):
        self.instances.clear()

clients = ClientManager()


def call_librados(fsid, method, cmd_name, timeout=30):
    def with_client():
        with ClusterConf.from_fsid(fsid).client as client:
            return method(client)

    if settings.SEPARATE_LIBRADOS_PROCESS:
        return run_in_external_process(with_client, cmd_name, timeout)
    else:
        client = clients[fsid]
        return method(client)


def undoable(func):
    """decorator for undoable actions. See `undo_transaction` for starting a transaction.

    Inspired by http://undo.readthedocs.io/. The decorated method should use the side
    effect of the first value as the "do" step and the side effect after the first element
    as the "undo" step.
    """
    def undo(runner):
        try:
            next(runner)
        except StopIteration:
            pass

    def wrapper(*args, **kwargs):
        self = args[0]
        runner = func(*args, **kwargs)
        ret = next(runner)
        stack = getattr(self, '_undo_stack', None)
        if stack is not None:
            stack.append(lambda: undo(runner))
        return ret
    return wrapper


def logged(func):
    def wrapper(*args, **kwargs):
        retval = None
        try:
            retval = func(*args, **kwargs)
        finally:
            logger.debug('{}, {}, {} -> {}'.format(func.__name__, args, kwargs, retval))
        return retval
    return wrapper


@contextmanager
def undo_transaction(undo_context, exception_type=ExternalCommandError, re_raise_exception=False):
    """Context manager for starting a transaction. Use `undoable` decorator for undoable actions.
    :type undo_context: T <= object
    :rtype: T
    """
    if getattr(undo_context, '_undo_stack', None) is not None:
        raise ValueError('Nested transactions are not supported.')
    try:
        undo_context._undo_stack = deque()
        yield undo_context
        try:
            delattr(undo_context, '_undo_stack')
        except AttributeError:
            logger.exception('Ignoring Attribute error here.')
    except exception_type as e:
        logger.exception('Will now undo steps performed.')
        stack = getattr(undo_context, '_undo_stack')
        delattr(undo_context, '_undo_stack')
        for undo_closure in reversed(stack):
            undo_closure()
        if re_raise_exception:
            raise


class MonApi(object):
    """
    API source: https://github.com/ceph/ceph/blob/master/src/mon/MonCommands.h
    """

    def __init__(self, fsid):
        """
        :type fsid: str | unicode
        """
        self.fsid = fsid

    @staticmethod
    def _args_to_argdict(**kwargs):
        return {k: v for (k, v) in kwargs.iteritems() if v is not None}

    def mds_metadata(self, who=None):
        """
        COMMAND("mds metadata name=who,type=CephString,req=false",
        "fetch metadata for mds <who>",
        "mds", "r", "cli,rest")
        """
        return self._call_mon_command('mds metadata',
                                      self._args_to_argdict(who=who))

    def mgr_metadata(self, who=None):
        """
        COMMAND("mgr metadata name=id,type=CephString,req=false",
        "dump metadata for all daemons or a specific daemon",
        "mgr", "r", "cli,rest")
        """
        return self._call_mon_command('mgr metadata',
                                      self._args_to_argdict(who=who))

    def mon_metadata(self, id=None):
        """
        COMMAND("mon metadata name=id,type=CephString,req=false",
        "fetch metadata for mon <id>",
        "mon", "r", "cli,rest")
        """
        return self._call_mon_command('mon metadata',
                                      self._args_to_argdict(id=id))

    def osd_crush_dump(self):
        return self._call_mon_command('osd crush dump')

    @undoable
    def osd_erasure_code_profile_set(self, name, profile=None):
        """
        COMMAND("osd erasure-code-profile set " \
                "name=name,type=CephString,goodchars=[A-Za-z0-9-_.] " \
                "name=profile,type=CephString,n=N,req=false", \
                "create erasure code profile <name> with [<key[=value]> ...] pairs. Add a --force
                at the end to override an existing profile (VERY DANGEROUS)", \
                "osd", "rw", "cli,rest")

        .. example::
            >>> api = MonApi()
            >>> api.osd_erasure_code_profile_set('five-three', ['k=5', 'm=3'])
            >>> api.osd_erasure_code_profile_set('my-rack', ['k=3', 'm=2',
            >>>                                  'ruleset-failure-domain=rack'])

        :param profile: Reverse engineering revealed: this is in fact a list of strings.
        :type profile: list[str]
        """
        yield self._call_mon_command('osd erasure-code-profile set',
                                     self._args_to_argdict(name=name, profile=profile),
                                     output_format='string')
        self.osd_erasure_code_profile_rm(name)

    def osd_erasure_code_profile_get(self, name):
        """
        COMMAND("osd erasure-code-profile get " \
                "name=name,type=CephString,goodchars=[A-Za-z0-9-_.]", \
                "get erasure code profile <name>", \
                "osd", "r", "cli,rest")
        """
        return self._call_mon_command('osd erasure-code-profile get',
                                      self._args_to_argdict(name=name))

    def osd_erasure_code_profile_rm(self, name):
        """
        COMMAND("osd erasure-code-profile rm " \
                "name=name,type=CephString,goodchars=[A-Za-z0-9-_.]", \
                "remove erasure code profile <name>", \
                "osd", "rw", "cli,rest")
        """
        return self._call_mon_command('osd erasure-code-profile rm',
                                      self._args_to_argdict(name=name), output_format='string')

    def osd_erasure_code_profile_ls(self):
        """
        COMMAND("osd erasure-code-profile ls", \
                "list all erasure code profiles", \
                "osd", "r", "cli,rest")
        """
        return self._call_mon_command('osd erasure-code-profile ls')

    @undoable
    def osd_pool_create(self, pool, pg_num, pgp_num, pool_type, erasure_code_profile=None,
                        ruleset=None, expected_num_objects=None):
        """
        COMMAND("osd pool create " \
            "name=pool,type=CephPoolname " \
            "name=pg_num,type=CephInt,range=0 " \
            "name=pgp_num,type=CephInt,range=0,req=false " \
            "name=pool_type,type=CephChoices,strings=replicated|erasure,req=false " \
            "name=erasure_code_profile,type=CephString,req=false,goodchars=[A-Za-z0-9-_.] " \
            "name=ruleset,type=CephString,req=false " \
            "name=expected_num_objects,type=CephInt,req=false", \
            "create pool", "osd", "rw", "cli,rest")

        :param pool: The pool name.
        :type pool: str
        :param pg_num: Number of pgs. pgs per osd should be about 100, independent of the number of
                       pools, as each osd can store pgs of multiple pools.
        :type pg_num: int
        :param pgp_num: *MUST* equal pg_num
        :type pgp_num: int
        :param pool_type: replicated | erasure
        :type pool_type: str
        :param erasure_code_profile: name of the erasure code profile.
            Created by :method:`osd_erasure_code_profile_set`.
        :type erasure_code_profile: str
        :returns: empty string
        :rtype: str
        """
        if pool_type == 'erasure' and not erasure_code_profile:
            raise ExternalCommandError('erasure_code_profile missing')
        yield self._call_mon_command(
            'osd pool create', self._args_to_argdict(pool=pool,
                                                     pg_num=pg_num,
                                                     pgp_num=pgp_num,
                                                     pool_type=pool_type,
                                                     erasure_code_profile=erasure_code_profile,
                                                     ruleset=ruleset,
                                                     expected_num_objects=expected_num_objects),
            output_format='string')
        self.osd_pool_delete(pool, pool, "--yes-i-really-really-mean-it")

    @undoable
    def osd_pool_set(self, pool, var, val, force=None, undo_previous_value=None):
        # TODO: crush_ruleset was renamed to crush_rule in Luminous. Thus add:
        #       >>> if var == 'crush_ruleset' and ceph_version >= luminous:
        #       >>>     var = 'crush_rule'
        """
        COMMAND("osd pool set " \
        "name=pool,type=CephPoolname " \
        "name=var,type=CephChoices,strings=size|min_size|crash_replay_interval|pg_num|pgp_num|
            crush_ruleset|hashpspool|nodelete|nopgchange|nosizechange|write_fadvise_dontneed|
            noscrub|nodeep-scrub|hit_set_type|hit_set_period|hit_set_count|hit_set_fpp|
            use_gmt_hitset|debug_fake_ec_pool|target_max_bytes|target_max_objects|
            cache_target_dirty_ratio|cache_target_dirty_high_ratio|cache_target_full_ratio|
            cache_min_flush_age|cache_min_evict_age|auid|min_read_recency_for_promote|
            min_write_recency_for_promote|fast_read|hit_set_grade_decay_rate|hit_set_search_last_n|
            scrub_min_interval|scrub_max_interval|deep_scrub_interval|recovery_priority|
            recovery_op_priority|scrub_priority " \
        "name=val,type=CephString " \
        "name=force,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "set pool parameter <var> to <val>", "osd", "rw", "cli,rest")

        :param pool: Pool name.
        :type pool: str
        :param var: The key
        :type var: Any
        :return: empty string.
        """
        yield self._call_mon_command(
            'osd pool set', self._args_to_argdict(pool=pool, var=var, val=val, force=force),
            output_format='string')
        self.osd_pool_set(pool, var, undo_previous_value)

    def osd_pool_delete(self, pool, pool2=None, sure=None):
        """
        COMMAND("osd pool delete " \
        "name=pool,type=CephPoolname " \
        "name=pool2,type=CephPoolname,req=false " \
        "name=sure,type=CephChoices,strings=--yes-i-really-really-mean-it,req=false", \
        "delete pool", \
        "osd", "rw", "cli,rest")

        Also handles `mon-allow-pool-delete=false`

        :param pool: Pool name
        :type pool: str | unicode
        :param pool2: Second pool name
        :type pool2: str | unicode
        :param sure: should be "--yes-i-really-really-mean-it"
        :type sure: str
        :return: empty string
        """

        cmd = 'osd pool delete'

        def impl(client):
            pool_delete_args = self._args_to_argdict(pool=pool, pool2=pool2, sure=sure)

            try:
                return client.mon_command(cmd, pool_delete_args, output_format='string')
            except ExternalCommandError as e:
                if e.code != EPERM:
                    raise

                if 'mon_allow_pool_delete' not in str(e):
                    logger.info('Expected to find "mon_allow_pool_delete" in ""'.format(str(e)))
                    raise

                logger.info('Executing fallback for mon_allow_pool_delete=false\n{}'.format(str(e)))

                mon_names = [mon['name'] for mon in
                             client.mon_command('mon dump')['mons']]  # ['a', 'b', 'c']
                try:
                    for mon_name in mon_names:
                        client.mon_command('injectargs',
                                           self._args_to_argdict(
                                                    injected_args=['--mon-allow-pool-delete=true']),
                                           output_format='string',
                                           target=mon_name)
                    res = client.mon_command(cmd, pool_delete_args, output_format='string')
                finally:
                    for mon_name in mon_names:
                        client.mon_command('injectargs',
                                           self._args_to_argdict(
                                                   injected_args=['--mon-allow-pool-delete=false']),
                                           output_format='string',
                                           target=mon_name)
                return res

        return call_librados(self.fsid, impl, cmd)

    @undoable
    def osd_pool_mksnap(self, pool, snap):
        """
        COMMAND("osd pool mksnap " \
        "name=pool,type=CephPoolname " \
        "name=snap,type=CephString", \
        "make snapshot <snap> in <pool>", "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd pool mksnap', self._args_to_argdict(pool=pool, snap=snap),
                                     output_format='string')
        self.osd_pool_rmsnap(pool, snap)

    def osd_pool_rmsnap(self, pool, snap):
        """
        COMMAND("osd pool rmsnap " \
        "name=pool,type=CephPoolname " \
        "name=snap,type=CephString", \
        "remove snapshot <snap> from <pool>", "osd", "rw", "cli,rest")
        """
        return self._call_mon_command('osd pool rmsnap',
                                      self._args_to_argdict(pool=pool, snap=snap),
                                      output_format='string')

    @undoable
    def osd_pool_application_enable(self, pool, app):
        """COMMAND("osd pool application enable " \
        "name=pool,type=CephPoolname " \
        "name=app,type=CephString,goodchars=[A-Za-z0-9-_.] " \
        "name=force,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "enable use of an application <app> [cephfs,rbd,rgw] on pool <poolname>",
        "osd", "rw", "cli,rest")"""
        yield self._call_mon_command('osd pool application enable', self._args_to_argdict(
            pool=pool, app=app, force='--yes-i-really-mean-it'), output_format='string')
        self.osd_pool_application_disable(pool, app)

    @undoable
    def osd_pool_application_disable(self, pool, app):
        """COMMAND("osd pool application disable " \
        "name=pool,type=CephPoolname " \
        "name=app,type=CephString " \
        "name=force,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "disables use of an application <app> on pool <poolname>",
        "osd", "rw", "cli,rest")"""
        yield self._call_mon_command('osd pool application disable', self._args_to_argdict(
            pool=pool, app=app, force='--yes-i-really-mean-it'), output_format='string')
        self.osd_pool_application_enable(pool, app)

    @undoable
    def osd_tier_add(self, pool, tierpool):
        """
        COMMAND("osd tier add " \
        "name=pool,type=CephPoolname " \
        "name=tierpool,type=CephPoolname " \
        "name=force_nonempty,type=CephChoices,strings=--force-nonempty,req=false",
        "add the tier <tierpool> (the second one) to base pool <pool> (the first one)", \
        "osd", "rw", "cli,rest")

        Modifies the 'tier_of' field of the cachepool

        .. example::
            >>> api = MonApi()
            >>> api.osd_tier_add('storagepool', 'cachepool')
            >>> api.osd_tier_cache_mode('cachepool', 'writeback')
            >>> api.osd_tier_set_overlay('storagepool', 'cachepool')

        .. note:: storagepool is typically of type replicated and cachepool is of type erasure
        """
        yield self._call_mon_command('osd tier add',
                                     self._args_to_argdict(pool=pool, tierpool=tierpool),
                                     output_format='string')
        self.osd_tier_remove(pool, tierpool)

    @undoable
    def osd_tier_remove(self, pool, tierpool):
        """
        COMMAND("osd tier remove " \
        "name=pool,type=CephPoolname " \
        "name=tierpool,type=CephPoolname",
        "remove the tier <tierpool> (the second one) from base pool <pool> (the first one)", \
        "osd", "rw", "cli,rest")

        .. example::
            >>> api = MonApi()
            >>> api.osd_tier_add('storagepool', 'cachepool')
            >>> api.osd_tier_remove('storagepool', 'cachepool')
        """
        yield self._call_mon_command('osd tier remove',
                                     self._args_to_argdict(pool=pool, tierpool=tierpool),
                                     output_format='string')
        self.osd_tier_add(pool, tierpool)

    @undoable
    def osd_tier_cache_mode(self, pool, mode, undo_previous_mode=None):
        """
        COMMAND("osd tier cache-mode " \
        "name=pool,type=CephPoolname " \
        "name=mode,type=CephChoices,strings=none|writeback|forward|readonly|readforward|proxy|
            readproxy " \
        "name=sure,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "specify the caching mode for cache tier <pool>", "osd", "rw", "cli,rest")

        Modifies the  'cache_mode' field  of `osd dump`.

        .. seealso:: method:`osd_tier_add`
        """
        yield self._call_mon_command('osd tier cache-mode',
                                     self._args_to_argdict(pool=pool, mode=mode),
                                     output_format='string')
        self.osd_tier_cache_mode(pool, undo_previous_mode)

    @undoable
    def osd_tier_set_overlay(self, pool, overlaypool):
        """
        COMMAND("osd tier set-overlay " \
        "name=pool,type=CephPoolname " \
        "name=overlaypool,type=CephPoolname", \
        "set the overlay pool for base pool <pool> to be <overlaypool>", "osd", "rw", "cli,rest")

        .. seealso:: method:`osd_tier_add`

        Modifies the `read_tier` field of the storagepool
        """
        yield self._call_mon_command('osd tier set-overlay',
                                     self._args_to_argdict(pool=pool, overlaypool=overlaypool),
                                     output_format='string')
        self.osd_tier_remove_overlay(pool)

    @undoable
    def osd_tier_remove_overlay(self, pool, undo_previous_overlay):
        """
        COMMAND("osd tier remove-overlay " \
        "name=pool,type=CephPoolname ", \
        "remove the overlay pool for base pool <pool>", "osd", "rw", "cli,rest")

        .. seealso:: method:`osd_tier_set_overlay`

        Modifies the `read_tier` field of the storagepool
        """
        yield self._call_mon_command('osd tier remove-overlay', self._args_to_argdict(pool=pool),
                                     output_format='string')
        self.osd_tier_set_overlay(pool, undo_previous_overlay)

    @undoable
    def osd_out(self, name):
        """
        COMMAND("osd out " \
        "name=ids,type=CephString,n=N", \
        "set osd(s) <id> [<id>...] out", "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd out', self._args_to_argdict(name=name),
                                     output_format='string')
        self.osd_in(name)

    @undoable
    def osd_in(self, name):
        """
        COMMAND("osd in " \
        "name=ids,type=CephString,n=N", \
        "set osd(s) <id> [<id>...] in", "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd in', self._args_to_argdict(name=name),
                                     output_format='string')
        self.osd_out(name)

    @undoable
    def osd_set(self, key):
        """
        COMMAND("osd set " \
        "name=key,type=CephChoices,strings=full|pause|noup|nodown|noout|noin|nobackfill|norebalance|
                                           norecover|noscrub|nodeep-scrub|notieragent|sortbitwise|
                                           recovery_deletes|require_jewel_osds|
                                           require_kraken_osds", \
        "set <key>", "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd set', self._args_to_argdict(key=key),
                                     output_format='string')
        self.osd_unset(key)

    @undoable
    def osd_unset(self, key):
        """
        COMMAND("osd unset " \
        "name=key,type=CephChoices,strings=full|pause|noup|nodown|noout|noin|nobackfill|norebalance|
                                           norecover|noscrub|nodeep-scrub|notieragent", \
        "unset <key>", "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd unset', self._args_to_argdict(key=key),
                                     output_format='string')
        self.osd_set(key)

    @undoable
    def osd_crush_reweight(self, name, weight, undo_previous_weight=None):
        """
        COMMAND("osd crush reweight " \
        "name=name,type=CephString,goodchars=[A-Za-z0-9-_.] " \
        "name=weight,type=CephFloat,range=0.0", \
        "change <name>'s weight to <weight> in crush map", \
        "osd", "rw", "cli,rest")
        """
        yield self._call_mon_command('osd crush reweight',
                                     self._args_to_argdict(name=name, weight=weight),
                                     output_format='string')
        self.osd_crush_reweight(name, undo_previous_weight)

    def osd_dump(self):
        """
        COMMAND("osd dump " \
        "name=epoch,type=CephInt,range=0,req=false",
        "print summary of OSD map", "osd", "r", "cli,rest")
        """
        return self._call_mon_command('osd dump')

    def osd_list(self):
        """
        Info about each osd, eg "up" or "down".

        :rtype: list[dict[str, Any]]
        """
        def unique_list_of_dicts(l):
            return reduce(lambda x, y: x if y in x else x + [y], l, [])

        tree = self.osd_tree()
        nodes = tree['nodes']
        if 'stray' in tree:
            nodes += tree['stray']
        for node in nodes:
            if u'depth' in node:
                del node[u'depth']
        nodes = unique_list_of_dicts(nodes)
        return list(unique_list_of_dicts([node for node in nodes if node['type'] == 'osd']))

    def osd_tree(self):
        """Does not return a tree, but a directed graph with multiple roots.

        Possible node types are: pool. zone, root, host, osd

        Note, OSDs may be duplicated in the list, although the u'depth' attribute may differ between
        them.

        ..warning:: does not return the physical structure, but the crushmap, which will differ on
            some clusters. An osd may be physically located on a different host, than it is returned
            by osd tree.
        """
        return self._call_mon_command('osd tree')

    def osd_metadata(self, id=None):
        """
        COMMAND("osd metadata " \
        "name=id,type=CephInt,range=0,req=false", \
        "fetch metadata for osd {id} (default all)", \
        "osd", "r", "cli,rest")

        :type name: int
        :rtype: list[dict] | dict
        """
        return self._call_mon_command('osd metadata', self._args_to_argdict(id=id))

    def osd_scrub(self, who):
        """
        COMMAND("osd scrub " \
        "name=who,type=CephString", \
        "initiate scrub on osd <who>, or use <all|any|*> to scrub all", \
        "osd", "rw", "cli,rest")
        """
        return self._call_mon_command('osd scrub', self._args_to_argdict(who=who),
                                      output_format='string')

    def osd_deep_scrub(self, who):
        """
        COMMAND("osd deep-scrub " \
        "name=who,type=CephString", \
        "initiate deep-scrub on osd <who>, or use <all|any|*> to scrub all", \
        "osd", "rw", "cli,rest")
        """
        return self._call_mon_command('osd deep-scrub', self._args_to_argdict(who=who),
                                      output_format='string')

    def fs_ls(self):
        return self._call_mon_command('fs ls')

    @undoable
    def fs_new(self, fs_name, metadata, data):
        """
        COMMAND("fs new " \
        "name=fs_name,type=CephString " \
        "name=metadata,type=CephString " \
        "name=data,type=CephString ", \
        "make new filesystem using named pools <metadata> and <data>", \
        "fs", "rw", "cli,rest")
        """
        yield self._call_mon_command('fs new', MonApi._args_to_argdict(
            fs_name=fs_name, metadata=metadata, data=data), output_format='string')
        self.fs_rm(fs_name, '--yes-i-really-mean-it')

    def fs_rm(self, fs_name, sure):
        """
        COMMAND("fs rm " \
        "name=fs_name,type=CephString " \
        "name=sure,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "disable the named filesystem", \
        "fs", "rw", "cli,rest")
        """
        return self._call_mon_command('fs rm', self._args_to_argdict(fs_name=fs_name, sure=sure),
                                      output_format='string')

    def pg_dump(self):
        """Also contains OSD statistics"""
        return self._call_mon_command('pg dump')

    def status(self):
        return self._call_mon_command('status')

    def health(self, detail=None):
        """:param detail: 'detail' or None"""
        return self._call_mon_command('health', self._args_to_argdict(detail=detail))

    def time_sync_status(self):
        return self._call_mon_command('time-sync-status')

    def df(self):
        return self._call_mon_command('df', self._args_to_argdict(detail='detail'))

    def _call_mon_command(self, cmd, argdict=None, output_format='json', timeout=30):
        return call_librados(self.fsid,
                             lambda client: client.mon_command(cmd, argdict, output_format), cmd,
                             timeout)


class RbdApi(object):
    """
    http://docs.ceph.com/docs/master/rbd/librbdpy/

    Exported features are defined here:
       https://github.com/ceph/ceph/blob/master/src/tools/rbd/ArgumentTypes.cc
    """

    RBD_DELETION_TIMEOUT = 3600

    @staticmethod
    def get_feature_mapping():
        ret = {
            getattr(rbd, feature): feature[12:].lower().replace('_', '-')
            for feature
            in dir(rbd)
            if feature.startswith('RBD_FEATURE_')
        }
        if not ret:
            raise ImportError('Your Ceph version is too old: RBD features are missing. Please'
                              ' update to a more recent Ceph version.')
        return ret

    @classmethod
    def _bitmask_to_list(cls, features):
        """
        :type features: int
        :rtype: list[str]
        """
        return [
            cls.get_feature_mapping()[key]
            for key
            in cls.get_feature_mapping().keys()
            if key & features == key
        ]

    @classmethod
    def _list_to_bitmask(cls, features):
        """
        :type features: list[str]
        :rtype: int
        """
        return reduce(lambda l, r: l | r,
                      [
                          cls.get_feature_mapping().keys()[cls.get_feature_mapping().values().index(
                              value)]
                          for value
                          in cls.get_feature_mapping().values()
                          if value in features
                      ],
                      0)

    def __init__(self, fsid):
        """
        :type fsid: str | unicode
        """
        self.fsid = fsid
        self.cluster_name = ClusterConf.from_fsid(fsid).name

    @logged
    @undoable
    def create(self, pool_name, image_name, size, old_format=True, features=None,
               order=None, stripe_unit=None, stripe_count=None, data_pool_name=None):
        """
        .. example::
                >>> api = RbdApi()
                >>> api.create('mypool', 'myimage',  4 * 1024 ** 3) # 4 GiB
                >>> api.remove('mypool', 'myimage')

        :param pool_name: RBDs are typically created in a pool named `rbd`.
        :param features: see :method:`image_features`. The Linux kernel module doesn't support
            all features.
        :param order: obj_size will be 2**order
        :type features: list[str]
        :param old_format: Some features are not supported by the old format.
        :type stripe_unit: int
        :type stripe_count: int
        :type data_pool_name: str | None
        """
        def _create(client):
            ioctx = client.get_pool(pool_name)
            rbd_inst = rbd.RBD()
            default_features = 0 if old_format else 61  # FIXME: hardcoded int
            feature_bitmask = (RbdApi._list_to_bitmask(features) if features is not None else
                               default_features)
            try:
                rbd_inst.create(ioctx, image_name, size, old_format=old_format,
                                features=feature_bitmask, order=order,
                                stripe_unit=stripe_unit, stripe_count=stripe_count,
                                data_pool=data_pool_name)
            except TypeError:
                logger.exception('This seems to be Jewel?!')
                rbd_inst.create(ioctx, image_name, size, old_format=old_format,
                                features=feature_bitmask, order=order)

        yield self._call_librados(_create)
        self.remove(pool_name, image_name)

    def remove(self, pool_name, image_name):
        def _remove(client):
            ioctx = client.get_pool(pool_name)
            rbd_inst = rbd.RBD()
            rbd_inst.remove(ioctx, image_name)

        self._call_librados(_remove, timeout=self.RBD_DELETION_TIMEOUT)

    def list(self, pool_name):
        """
        :returns: list -- a list of image names
        :rtype: list[str]
        """
        def _list(client):
            ioctx = client.get_pool(pool_name)
            rbd_inst = rbd.RBD()
            return rbd_inst.list(ioctx)

        return self._call_librados(_list)

    def image_stat(self, pool_name, name, snapshot=None):
        """

        obj_size is similar to the block size of ordinary hard drives.
        :param name: the name of the image
        :type name: str | unicode
        :param snapshot: which snapshot to read from
        :type snapshot: str
        """
        def _get_image_status(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name, snapshot=snapshot) as image:
                return image.stat()

        return self._call_librados(_get_image_status)

    def _call_rbd_tool(self, cmd, pool_name, name):
        """ Calls a RBD command and returns the result as dict.

        :param cmd: Command that should be called
        :type cmd: str
        :param pool_name: Name of the pool
        :type pool_name: str
        :param name: Name of the RBD image
        :type name: str
        :return: Result of the rbd command
        :rtype: dict
        """
        cluster_conf = ClusterConf.from_fsid(self.fsid)
        proc = subprocess.Popen(['rbd', cmd, '--conf', cluster_conf.file_path, '--pool', pool_name,
                                 '--image', name, '--format', 'json',
                                 '--name', cluster_conf.keyring.user_name,
                                 '-k', cluster_conf.keyring.file_name],
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE)
        out, err = proc.communicate()
        if proc.returncode:
            raise ExternalCommandError('rbd failed: {}'.format(err), code=proc.returncode)
        return json.loads(out)

    def image_disk_usage(self, pool_name, name):
        """The "rbd du" command is not exposed in python, as it
        is directly implemented in the rbd tool."""
        du = self._call_rbd_tool('disk-usage', pool_name, name)['images']
        return du[0] if du else {}

    def image_info(self, pool_name, name):
        """The "rbd info" command is not exposed in python, as it
        is directly implemented in the rbd tool."""
        info = self._call_rbd_tool('info', pool_name, name)
        return info if info else {}

    def image_stripe_info(self, pool_name, name, snapshot=None):
        """:returns: tuple of count and unit"""
        def _get_stripe_infos(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name, snapshot=snapshot) as image:
                try:
                    return image.stripe_count(), image.stripe_unit()
                except AttributeError:
                    return None, None

        return self._call_librados(_get_stripe_infos)

    @undoable
    def image_resize(self, pool_name, name, size):
        """This is marked as 'undoable' but as resizing an image is inherently destructive,
        we cannot magically restore lost data."""
        def _image_resize(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                original_size = image.size()
                return original_size, image.resize(size)

        original_size, result = self._call_librados(_image_resize)
        yield result
        self.image_resize(pool_name, name, original_size)

    def image_features(self, pool_name, name):
        def _get_image_features(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                return RbdApi._bitmask_to_list(image.features())

        return self._call_librados(_get_image_features)

    @undoable
    def image_set_feature(self, pool_name, name, feature, enabled):
        """:type enabled: bool"""
        def _set_image_features(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                bitmask = RbdApi._list_to_bitmask([feature])
                if bitmask not in RbdApi.get_feature_mapping().keys():
                    raise ValueError(u'Feature "{}" is unknown.'.format(feature))
                image.update_features(bitmask, enabled)

        yield self._call_librados(_set_image_features)
        self.image_set_feature(pool_name, name, feature, not enabled)  # Undo step

    def image_old_format(self, pool_name, name):
        def _check_format_type(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                return image.old_format()

        return self._call_librados(_check_format_type)

    def _call_librados(self, func, timeout=30):
        """:type func: (Client) -> Any"""
        cmd = func.__name__[1:].replace('_', ' ')
        cmd = 'rbd {}'.format(cmd)
        return call_librados(self.fsid, func, cmd, timeout)
