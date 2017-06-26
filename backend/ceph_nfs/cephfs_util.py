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
    def instance(cluster_name='ceph'):
        if cluster_name not in CephFSUtil._instance:
            CephFSUtil._instance[cluster_name] = CephFSUtil()
        return CephFSUtil._instance[cluster_name]

    def __init__(self, cluster_name='ceph'):
        self.cfs = libcephfs.LibCephFS(conffile='/etc/ceph/{}.conf'.format(cluster_name))
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
