"""
 *  Copyright (c) 2017 SUSE LLC
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

from ceph_radosgw.views import proxy_view, bucket_create, bucket_delete, bucket_get, user_delete

urlpatterns = patterns('',
                       url('^api/ceph_radosgw/bucket/create', bucket_create),
                       url('^api/ceph_radosgw/bucket/get', bucket_get),
                       url('^api/ceph_radosgw/bucket/delete', bucket_delete),
                       url('^api/ceph_radosgw/user/delete', user_delete),
                       url('^api/rgw/(?P<path>.*)', proxy_view)
                       )
