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

from django.conf.urls import patterns, url, include
from rest_framework import routers

from ceph.restapi import *

router = routers.SimpleRouter(trailing_slash=False)
router.register(r'osds', CephOsdViewSet, 'osd')
router.register(r'pools', CephPoolViewSet, 'pool')
router.register(r'pgs', CephPgViewSet, 'pg')
router.register(r'erasure-code-profiles', CephErasureCodeProfileViewSet, 'erasure-code-profile')
router.register(r'rbds', CephRbdViewSet, 'rbd')

cluster_router = routers.SimpleRouter(trailing_slash=False)
cluster_router.register(r'ceph', CephClusterViewSet, 'ceph')

urlpatterns = patterns('',
                       url(r'^api/', include(cluster_router.urls, namespace='api'), name='ceph'),
                       url(r'^api/ceph/[a-zA-Z0-9-]+/', include(router.urls, namespace='api/ceph/'), name='details'),
                       )
