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

from django.conf.urls import patterns, url, include
from rest_framework import routers

from ceph_nfs.views.ganesha_export_viewset import GaneshaExportViewSet
from ceph_nfs.views.ganesha_mgr_view import hosts, fsals, status, deploy, stop, ls_dir, buckets


router = routers.SimpleRouter(trailing_slash=False)
router.register(r'exports', GaneshaExportViewSet, 'export')

export_detail = GaneshaExportViewSet.as_view({
    'get': 'retrieve',
    'put': 'update'
})

urlpatterns = patterns('',
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/',
                           include(router.urls, namespace='api/ceph_nfs/'),
                           name='ceph_nfs'),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/exports/(?P<host>[^/]+)/'
                           '(?P<exportId>[0-9]+)$', export_detail, name='ceph_nfs_export_detail'),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/hosts', hosts, name="ceph_nfs_hosts"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/fsals', fsals, name="ceph_nfs_fsals"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/status', status,
                           name="ceph_nfs_service_status"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/deploy', deploy,
                           name="ceph_nfs_service_deploy"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/stop', stop,
                           name="ceph_nfs_service_stop"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/ls_dir', ls_dir, name="ceph_nfs_ls_dir"),
                       url(r'^api/ceph_nfs/[a-zA-Z0-9-]+/buckets', buckets,
                           name="ceph_nfs_buckets"),
                      )
