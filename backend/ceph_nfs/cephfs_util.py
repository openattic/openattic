# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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
import logging

from contextlib import contextmanager
import cephfs as libcephfs


logger = logging.getLogger(__name__)


class CephFSUtil(object):
    _instance = {}

    @staticmethod
    def instance(cluster):
        """Initializes or returns a singleton reference to a CephFS util wrapper instance

        :param cluster ceph.models.CephCluster: ceph cluster model instance
        """
        if cluster.name not in CephFSUtil._instance:
            CephFSUtil._instance[cluster.name] = CephFSUtil(cluster=cluster)
        return CephFSUtil._instance[cluster.name]

    def __init__(self, conf_file='/etc/ceph/ceph.conf', auth_id='admin',
                 keyring_file='/etc/ceph/ceph.client.admin.keyring', cluster=None):
        """Creates a CephFS util wrapper instance

        :param conf_file str opt: ceph conf file path
        :param auth_id str opt: the id used to authenticate the client entity (e.g.,
                                client.admin, openattic)
        :param keyring_file str opt: the keyring file path
        :param cluster ceph.models.CephCluster opt: ceph cluster model instance
        """
        if cluster:
            conf_file = cluster.config_file_path
            auth_id = cluster.keyring_user

            # if the auth_id starts with the prefix "client." we need to remove it 
            if auth_id.startswith('client.'):
                auth_id = auth_id[auth_id.find('.')+1:]
            keyring_file = cluster.keyring_file_path

        logger.debug("Initializing CephFS connection: conf_file=%s, auth_id=%s, keyring_file=%s",
                     conf_file, auth_id, keyring_file)

        self.cfs = libcephfs.LibCephFS(conffile=conf_file, auth_id=auth_id,
                                       conf={'keyring': keyring_file})
        self.cfs.mount()

    def __del__(self):
        self.cfs.shutdown()

    def status(self):
        try:
            self.get_dir_list('/', 1)
            return True
        except Exception:
            return False

    @contextmanager
    def opendir(self, dirpath):
        d = None
        try:
            d = self.cfs.opendir(dirpath)
            yield d
        finally:
            if d:
                self.cfs.closedir(d)

    def get_dir_list(self, dirpath, level):
        if level == 0:
            return [dirpath]
        with self.opendir(dirpath) as d:
            dent = self.cfs.readdir(d)
            paths = [dirpath]
            while dent:
                if dent.d_name in [b'.', b'..']:
                    dent = self.cfs.readdir(d)
                    continue
                if dent.is_dir():
                    subdirpath = b'{}{}/'.format(dirpath, dent.d_name)
                    paths.extend(self.get_dir_list(subdirpath, level-1))
                dent = self.cfs.readdir(d)
        return paths

    def dir_exists(self, dirpath):
        try:
            with self.opendir(dirpath):
                return True
        except libcephfs.ObjectNotFound:
            return False

    def mkdirs(self, dirpath):
        if dirpath == '/':
            raise Exception('Cannot create root directory "/"')
        if self.dir_exists(dirpath):
            return

        logger.info("Creating directory: %s", dirpath)
        self.cfs.mkdirs(b"{}".format(dirpath), 0o755)
