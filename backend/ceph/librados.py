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
from itertools import product

import rados
import os
import json
import glob
import logging
import ConfigParser

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
            logger.info("Selected keyring {}".format(self.filename))
        else:
            logger.error("No usable keyring")
            raise RuntimeError("Check keyring permissions")

        self._username()
        logger.info("Connecting as {}".format(self.username))

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

    def _get_pool(self, pool_name):
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
        return self._get_pool(pool_name).get_stats()

    def change_pool_owner(self, pool_name, auid):
        return self._get_pool(pool_name).change_auid(auid)

    def list_osds(self):
        """
        Args:
            obj_type (str): Either "osd" or "host" or "root"

        Returns:
            list[dict]: Info about each osd, eg "up" or "down". Also adding the `hostname`.
        """
        nodes = self.mon_command("osd tree")["nodes"]
        return [dict(hostname=k["name"], **v) for (k, v) in product(nodes, nodes)
                if v["type"] == "osd" and "children" in k and v["id"] in k["children"]]

    def mon_command(self, cmd):
        """Calls a monitor command and returns the result as dict.

        If `cmd` is a string, it'll be used as the argument to 'prefix'. If `cmd` is a dict
        otherwise, it'll be used directly as input for the mon_command and you'll have to specify
        the 'prefix' argument yourself.

        Args:
            cmd (str | dict): the command
        """

        if type(cmd) is str:
            return self.mon_command(
                {'prefix': cmd,
                 'format': 'json'})

        elif type(cmd) is dict:
            (ret, out, err) = self._cluster.mon_command(
                json.dumps(cmd),
                '',
                timeout=self._default_timeout)

            if ret == 0:
                return json.loads(out)
            else:
                raise ExternalCommandError(err)


class ExternalCommandError(Exception):
    pass
