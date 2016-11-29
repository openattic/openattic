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
from collections import deque
from contextlib import contextmanager, closing
from itertools import product
from conf import settings

import rados
import os
import json
import glob
import logging
import multiprocessing
import ConfigParser

import rbd

logger = logging.getLogger(__name__)


class Keyring(object):
    """
    Returns usable keyring
    """
    def __init__(self, cluster_name='ceph', ceph_dir='/etc/ceph'):
        """
        Sets keyring filename and username
        """
        self.filename = None
        self.username = None

        keyrings = glob.glob("{}/{}.client.*.keyring".format(ceph_dir, cluster_name))
        self._find(keyrings)

        if self.filename:
            logger.debug("Selected keyring {}".format(self.filename))
        else:
            logger.error("No usable keyring")
            raise RuntimeError("Check keyring permissions")

        self._username()
        logger.debug("Connecting as {}".format(self.username))

    def _find(self, keyrings):
        """
        Check permissions on keyrings, set last usable keyring
        """
        for keyring in keyrings:
            if os.access(keyring, os.R_OK):
                self.filename = keyring
            else:
                logger.info("Skipping {}, permission denied".format(keyring))

    def _username(self):
        """
        Parse keyring for username
        """
        _config = ConfigParser.ConfigParser()
        try:
            _config.read(self.filename)
        except ConfigParser.ParsingError:
            # ConfigParser fails on leading whitespace for keys
            pass

        try:
            self.username = _config.sections()[0]
        except IndexError:
            error_msg = "Corrupt keyring, check {}".format(self.filename)
            logger.error(error_msg)
            raise RuntimeError(error_msg)


class Client(object):
    """Represents the connection to a single ceph cluster."""

    def __init__(self, cluster_name='ceph'):
        self.cluster_name = cluster_name
        self._conf_file = os.path.join('/etc/ceph/', cluster_name + '.conf')
        keyring = Keyring(cluster_name)
        self._keyring = keyring.filename
        self._name = keyring.username
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

    def mon_command(self, cmd, argdict=None, output_format='json'):
        """Calls a monitor command and returns the result as dict.

        If `cmd` is a string, it'll be used as the argument to 'prefix'. If `cmd` is a dict
        otherwise, it'll be used directly as input for the mon_command and you'll have to specify
        the 'prefix' argument yourself.

        :param cmd: the command
        :type cmd: str | dict[str, Any]
        :param argdict: Additional Command-Parameters
        :type argdict: dict[str, Any]
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
                {'prefix': cmd}, argdict, output_format)

        elif type(cmd) is dict:
            (ret, out, err) = self._cluster.mon_command(
                json.dumps(dict(cmd,
                                format=output_format,
                                **argdict if argdict is not None else {})),
                '',
                timeout=self._default_timeout)
            logger.debug('mod command {}, {}, {}'.format(cmd, argdict, err))
            if ret == 0:
                return json.loads(out) if output_format == "json" else out
            else:
                raise ExternalCommandError(err, cmd, argdict)


class ExternalCommandError(Exception):
    def __init__(self, err, cmd=None, argdict=None):
        argdict = argdict if isinstance(argdict, dict) else {}
        if cmd is None:
            s = err
        else:
            cmd = cmd['prefix'] if isinstance(cmd, dict) and 'prefix' in cmd else cmd
            s = 'Executing "{} {}" failed: {}'.format(cmd, ' '.join(
                ['{}={}'.format(k, v) for k, v in argdict.items()]), err)
        super(ExternalCommandError, self).__init__(s)


def call_librados(fsid, method, timeout=30):
    def _get_client():
        from ceph.models import CephCluster
        cluster_name = CephCluster.get_name(fsid)
        client = Client(cluster_name)
        return client

    class LibradosProcess(multiprocessing.Process):
        def __init__(self, fsid, com_pipe):
            multiprocessing.Process.__init__(self)
            self.com_pipe = com_pipe
            self.fsid = fsid

        def run(self):
            with closing(self.com_pipe):
                try:
                    with _get_client() as client:
                        res = method(client)
                        self.com_pipe.send(res)
                except Exception as e:
                    self.com_pipe.send(e)

    if settings.SEPARATE_LIBRADOS_PROCESS:
        com1, com2 = multiprocessing.Pipe()
        p = LibradosProcess(fsid, com2)
        p.start()
        with closing(com1):
            if com1.poll(timeout):
                res = com1.recv()
                p.join()
                if isinstance(res, Exception):
                    raise res
                return res
            else:
                p.terminate()
                raise ExternalCommandError('Process {} with ID {} terminated because of timeout '
                                           '({} sec).'.format(p.name, p.pid, timeout))
    else:
        with _get_client() as client:
            return method(client)


def call_librados_api(func):
    def wrapper(self, *args, **kwargs):
        def impl(client):
            return func(self, client, *args, **kwargs)
        return call_librados(self.fsid, impl)
    return wrapper


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

    @undoable
    @call_librados_api
    def osd_erasure_code_profile_set(self, client, name, profile=None):
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
        yield client.mon_command('osd erasure-code-profile set',
                                 self._args_to_argdict(name=name, profile=profile),
                                 output_format='string')
        self.osd_erasure_code_profile_rm(name)

    @call_librados_api
    def osd_erasure_code_profile_get(self, client, name):
        """
        COMMAND("osd erasure-code-profile get " \
                "name=name,type=CephString,goodchars=[A-Za-z0-9-_.]", \
                "get erasure code profile <name>", \
                "osd", "r", "cli,rest")
        """
        return client.mon_command('osd erasure-code-profile get',
                                  self._args_to_argdict(name=name))

    @call_librados_api
    def osd_erasure_code_profile_rm(self, client, name):
        """
        COMMAND("osd erasure-code-profile rm " \
                "name=name,type=CephString,goodchars=[A-Za-z0-9-_.]", \
                "remove erasure code profile <name>", \
                "osd", "rw", "cli,rest")
        """
        return client.mon_command('osd erasure-code-profile rm',
                                  self._args_to_argdict(name=name), output_format='string')

    @call_librados_api
    def osd_erasure_code_profile_ls(self, client):
        """
        COMMAND("osd erasure-code-profile ls", \
                "list all erasure code profiles", \
                "osd", "r", "cli,rest")
        """
        return client.mon_command('osd erasure-code-profile ls')

    @undoable
    @call_librados_api
    def osd_pool_create(self, client, pool, pg_num, pgp_num, pool_type, erasure_code_profile=None,
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
        yield client.mon_command(
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
    @call_librados_api
    def osd_pool_set(self, client, pool, var, val, force=None, undo_previous_value=None):
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
        yield client.mon_command(
            'osd pool set', self._args_to_argdict(pool=pool, var=var, val=val, force=force),
            output_format='string')
        self.osd_pool_set(pool, var, undo_previous_value)

    @call_librados_api
    def osd_pool_delete(self, client, pool, pool2=None, sure=None):
        """
        COMMAND("osd pool delete " \
        "name=pool,type=CephPoolname " \
        "name=pool2,type=CephPoolname,req=false " \
        "name=sure,type=CephChoices,strings=--yes-i-really-really-mean-it,req=false", \
        "delete pool", \
        "osd", "rw", "cli,rest")

        :param pool: Pool name
        :type pool: str | unicode
        :param pool2: Second pool name
        :type pool2: str | unicode
        :param sure: should be "--yes-i-really-really-mean-it"
        :type sure: str
        :return: empty string
        """
        return client.mon_command('osd pool delete',
                                  self._args_to_argdict(pool=pool, pool2=pool2, sure=sure),
                                  output_format='string')

    @undoable
    @call_librados_api
    def osd_pool_mksnap(self, client, pool, snap):
        """
        COMMAND("osd pool mksnap " \
        "name=pool,type=CephPoolname " \
        "name=snap,type=CephString", \
        "make snapshot <snap> in <pool>", "osd", "rw", "cli,rest")
        """
        yield client.mon_command('osd pool mksnap', self._args_to_argdict(pool=pool, snap=snap),
                                 output_format='string')
        self.osd_pool_rmsnap(pool, snap)

    @call_librados_api
    def osd_pool_rmsnap(self, client, pool, snap):
        """
        COMMAND("osd pool rmsnap " \
        "name=pool,type=CephPoolname " \
        "name=snap,type=CephString", \
        "remove snapshot <snap> from <pool>", "osd", "rw", "cli,rest")
        """
        return client.mon_command('osd pool rmsnap', self._args_to_argdict(pool=pool, snap=snap),
                                  output_format='string')

    @undoable
    @call_librados_api
    def osd_tier_add(self, client, pool, tierpool):
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
        yield client.mon_command('osd tier add',
                                 self._args_to_argdict(pool=pool, tierpool=tierpool),
                                 output_format='string')
        self.osd_tier_remove(pool, tierpool)

    @undoable
    @call_librados_api
    def osd_tier_remove(self, client, pool, tierpool):
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
        yield client.mon_command('osd tier remove',
                                 self._args_to_argdict(pool=pool, tierpool=tierpool),
                                 output_format='string')
        self.osd_tier_add(pool, tierpool)

    @undoable
    @call_librados_api
    def osd_tier_cache_mode(self, client, pool, mode, undo_previous_mode=None):
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
        yield client.mon_command('osd tier cache-mode',
                                 self._args_to_argdict(pool=pool, mode=mode),
                                 output_format='string')
        self.osd_tier_cache_mode(pool, undo_previous_mode)

    @undoable
    @call_librados_api
    def osd_tier_set_overlay(self, client, pool, overlaypool):
        """
        COMMAND("osd tier set-overlay " \
        "name=pool,type=CephPoolname " \
        "name=overlaypool,type=CephPoolname", \
        "set the overlay pool for base pool <pool> to be <overlaypool>", "osd", "rw", "cli,rest")

        .. seealso:: method:`osd_tier_add`

        Modifies the `read_tier` field of the storagepool
        """
        yield client.mon_command('osd tier set-overlay',
                                 self._args_to_argdict(pool=pool, overlaypool=overlaypool),
                                 output_format='string')
        self.osd_tier_remove_overlay(pool)

    @undoable
    @call_librados_api
    def osd_tier_remove_overlay(self, client, pool, undo_previous_overlay):
        """
        COMMAND("osd tier remove-overlay " \
        "name=pool,type=CephPoolname ", \
        "remove the overlay pool for base pool <pool>", "osd", "rw", "cli,rest")

        .. seealso:: method:`osd_tier_set_overlay`

        Modifies the `read_tier` field of the storagepool
        """
        yield client.mon_command('osd tier remove-overlay', self._args_to_argdict(pool=pool),
                                 output_format='string')
        self.osd_tier_set_overlay(pool, undo_previous_overlay)

    @undoable
    @call_librados_api
    def osd_out(self, client, name):
        """
        COMMAND("osd out " \
        "name=ids,type=CephString,n=N", \
        "set osd(s) <id> [<id>...] out", "osd", "rw", "cli,rest")
        """
        yield client.mon_command('osd out', self._args_to_argdict(name=name),
                                 output_format='string')
        self.osd_in(name)

    @undoable
    @call_librados_api
    def osd_in(self, client, name):
        """
        COMMAND("osd in " \
        "name=ids,type=CephString,n=N", \
        "set osd(s) <id> [<id>...] in", "osd", "rw", "cli,rest")
        """
        yield client.mon_command('osd in', self._args_to_argdict(name=name), output_format='string')
        self.osd_out(name)

    @undoable
    @call_librados_api
    def osd_crush_reweight(self, client, name, weight, undo_previous_weight=None):
        """
        COMMAND("osd crush reweight " \
        "name=name,type=CephString,goodchars=[A-Za-z0-9-_.] " \
        "name=weight,type=CephFloat,range=0.0", \
        "change <name>'s weight to <weight> in crush map", \
        "osd", "rw", "cli,rest")
        """
        yield client.mon_command('osd crush reweight',
                                 self._args_to_argdict(name=name, weight=weight),
                                 output_format='string')
        self.osd_crush_reweight(name, undo_previous_weight)

    @call_librados_api
    def osd_dump(self, client):
        return client.mon_command('osd dump')

    def osd_list(self):
        """
        Info about each osd, eg "up" or "down".

        :rtype: list[dict[str, Any]]
        """
        def unique_list_of_dicts(l):
            return reduce(lambda x, y: x if y in x else x + [y], l, [])

        nodes = self.osd_tree()["nodes"]
        for node in nodes:
            if u'depth' in node:
                del node[u'depth']
        nodes = unique_list_of_dicts(nodes)
        return list(unique_list_of_dicts([v
                                          for (k, v) in product(nodes, nodes)
                    if v["type"] == "osd" and "children" in k and v["id"] in k["children"]]))

    @call_librados_api
    def osd_tree(self, client):
        """Does not return a tree, but a directed graph with multiple roots.

        Possible node types are: pool. zone, root, host, osd

        Note, OSDs may be duplicated in the list, although the u'depth' attribute may differ between
        them.

        ..warning:: does not return the physical structure, but the crushmap, which will differ on
            some clusters. An osd may be physically located on a different host, than it is returned
            by osd tree.
        """
        return client.mon_command('osd tree')

    @call_librados_api
    def osd_metadata(self, client, name=None):
        """
        COMMAND("osd metadata " \
        "name=id,type=CephInt,range=0,req=false", \
        "fetch metadata for osd {id} (default all)", \
        "osd", "r", "cli,rest")

        :type name: int
        :rtype: list[dict] | dict
        """
        return client.mon_command('osd metadata', self._args_to_argdict(name=name))

    def fs_ls(self, client):
        return client.mon_command('fs ls')

    @undoable
    @call_librados_api
    def fs_new(self, client, fs_name, metadata, data):
        """
        COMMAND("fs new " \
        "name=fs_name,type=CephString " \
        "name=metadata,type=CephString " \
        "name=data,type=CephString ", \
        "make new filesystem using named pools <metadata> and <data>", \
        "fs", "rw", "cli,rest")
        """
        yield client.mon_command('fs new', self._args_to_argdict(
            fs_name=fs_name, metadata=metadata, data=data), output_format='string')
        self.fs_rm(fs_name, '--yes-i-really-mean-it')

    @call_librados_api
    def fs_rm(self, client, fs_name, sure):
        """
        COMMAND("fs rm " \
        "name=fs_name,type=CephString " \
        "name=sure,type=CephChoices,strings=--yes-i-really-mean-it,req=false", \
        "disable the named filesystem", \
        "fs", "rw", "cli,rest")
        """
        return client.mon_command('fs rm', self._args_to_argdict(fs_name=fs_name, sure=sure),
                                      output_format='string')

    @call_librados_api
    def pg_dump(self, client):
        """Also contains OSD statistics"""
        return client.mon_command('pg dump')

    @call_librados_api
    def status(self, client):
        return client.mon_command('status')

    @call_librados_api
    def health(self, client):
        return client.mon_command('health')

    @call_librados_api
    def df(self, client):
        return client.mon_command('df')


class RbdApi(object):
    """
    http://docs.ceph.com/docs/master/rbd/librbdpy/

    Exported features are defined here:
       https://github.com/ceph/ceph/blob/master/src/tools/rbd/ArgumentTypes.cc
    """
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
        from ceph.models import CephCluster
        self.fsid = fsid
        self.cluster_name = CephCluster.get_name(self.fsid)

    @logged
    @undoable
    def create(self, pool_name, image_name, size, old_format=True, features=None,
               order=None):
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
        """
        def _do(client):
            ioctx = client.get_pool(pool_name)
            rbd_inst = rbd.RBD()
            default_features = 0 if old_format else 61  # FIXME: hardcoded int
            feature_bitmask = (RbdApi._list_to_bitmask(features) if features is not None else
                               default_features)
            rbd_inst.create(ioctx, image_name, size, old_format=old_format,
                            features=feature_bitmask, order=order)

        def _undo(client):
            client.remove(pool_name, image_name)

        yield self._call_librados(_do)
        self._call_librados(_undo)

    @call_librados_api
    def remove(self, client, pool_name, image_name):
        ioctx = client.get_pool(pool_name)
        rbd_inst = rbd.RBD()
        rbd_inst.remove(ioctx, image_name)

    @call_librados_api
    def list(self, client, pool_name):
        """
        :returns: list -- a list of image names
        :rtype: list[str]
        """
        ioctx = client.get_pool(pool_name)
        rbd_inst = rbd.RBD()
        return rbd_inst.list(ioctx)

    @call_librados_api
    def image_stat(self, client, pool_name, name, snapshot=None):
        """

        obj_size is similar to the block size of ordinary hard drives.
        :param name: the name of the image
        :type name: str
        :param snapshot: which snapshot to read from
        :type snapshot: str
        """
        ioctx = client.get_pool(pool_name)
        with rbd.Image(ioctx, name=name, snapshot=snapshot) as image:
            return image.stat()

    def image_disk_usage(self, pool_name, name):
        """The "rbd du" command is not exposed in python, as it
        is directly implemented in the rbd tool."""
        out = subprocess.check_output(['rbd', 'disk-usage', '--cluster', self.cluster_name,
                                       '--pool', pool_name, '--image', name, '--format', 'json'])
        du = json.loads(out)['images']
        return du[0] if du else {}

    @undoable
    def image_resize(self, pool_name, name, size):
        """This is marked as 'undoable' but as resizing an image is inherently destructive,
        we cannot magically restore lost data."""
        def _get_original_size(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                return image.size()

        def _do(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                image.resize(size)

        original_size = self._call_librados(_get_original_size)
        yield self._call_librados(_do)
        self.image_resize(pool_name, name, original_size)

    @call_librados_api
    def image_features(self, client, pool_name, name):
        ioctx = client.get_pool(pool_name)
        with rbd.Image(ioctx, name=name) as image:
            return RbdApi._bitmask_to_list(image.features())

    @undoable
    def image_set_feature(self, pool_name, name, feature, enabled):
        """:type enabled: bool"""
        def _do(client):
            ioctx = client.get_pool(pool_name)
            with rbd.Image(ioctx, name=name) as image:
                bitmask = RbdApi._list_to_bitmask([feature])
                if bitmask not in RbdApi.get_feature_mapping().keys():
                    raise ValueError(u'Feature "{}" is unknown.'.format(feature))
                image.update_features(bitmask, enabled)

        yield self._call_librados(_do)
        self.image_set_feature(pool_name, name, feature, not enabled) # Undo step

    @call_librados_api
    def image_old_format(self, client, pool_name, name):
        ioctx = client.get_pool(pool_name)
        with rbd.Image(ioctx, name=name) as image:
            return image.old_format()

    def _call_librados(self, func):
        return call_librados(self.fsid, lambda client: func(client))
