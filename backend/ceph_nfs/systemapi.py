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
from systemd.plugins import logged, BasePlugin, method
from ceph.models import CephCluster
from ceph_nfs.cephfs_util import CephFSUtil


@logged
class SystemD(BasePlugin):
    dbus_path = "/cephfs"

    @method(in_signature="ss")
    def cephfs_mkdirs(self, fsid, dirpath):
        cluster = CephCluster.objects.get(fsid=fsid)
        CephFSUtil.instance(cluster).mkdirs(dirpath)
