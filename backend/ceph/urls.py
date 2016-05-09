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

from django.conf.urls import patterns, url
from ceph.restapi import CephPoolViewSet, CephOsdViewSet, CephClusterViewSet

urlpatterns = patterns('',
                       url(r'^api/ceph$',
                           CephClusterViewSet.as_view({'get': 'list'}),
                           name='cluster-list'),
                       url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)$',
                           CephClusterViewSet.as_view({'get': 'retrieve'}),
                           name='cluster-detail'),
                       url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/pools$',
                           CephPoolViewSet.as_view({'get': 'list'}),
                           name='pool-list'),
                       url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/pools/(?P<pool_id>[0-9]+)$',
                           CephPoolViewSet.as_view({'get': 'retrieve'}),
                           name='pool-detail'),
                       url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/osds$',
                           CephOsdViewSet.as_view({'get': 'list'}),
                           name='pool-list'),
                       url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/osds/(?P<osd_id>[0-9]+)',
                           CephOsdViewSet.as_view({'get': 'retrieve'}),
                           name='osd-detail'),
                       )
