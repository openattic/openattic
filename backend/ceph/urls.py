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
from ceph.restapi import CephPoolViewSet

pool_detail = CephPoolViewSet.as_view({'get': 'retrieve'})

urlpatterns = patterns(
    '',
    url(r'^api/ceph/(?P<fsid>[a-zA-Z0-9-]+)/pools/(?P<pool_id>[0-9]+)',
        pool_detail,
        name='pool-detail'), )
