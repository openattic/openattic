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

from ceph_iscsi.views.iscsi_interface_viewset import iSCSIInterfaceViewSet
from ceph_iscsi.views.iscsi_target_viewset import iSCSITargetViewSet
from ceph_iscsi.views.iscsi_mgr_view import iscsi_status, iscsi_deploy, iscsi_undeploy

router = routers.SimpleRouter(trailing_slash=False)
router.register(r'iscsiinterfaces', iSCSIInterfaceViewSet, 'iscsiinterface')
router.register(r'iscsitargets', iSCSITargetViewSet, 'iscsitarget')

urlpatterns = patterns('',
                       url(r'^api/ceph_iscsi/[a-zA-Z0-9-]+/',
                           include(router.urls, namespace='api/ceph_iscsi/'),
                           name='ceph_iscsi'),
                       url(r'^api/ceph_iscsi/[a-zA-Z0-9-]+/iscsistatus', iscsi_status,
                           name="iscsistatus"),
                       url(r'^api/ceph_iscsi/[a-zA-Z0-9-]+/iscsideploy', iscsi_deploy,
                           name="iscsideploy"),
                       url(r'^api/ceph_iscsi/[a-zA-Z0-9-]+/iscsiundeploy', iscsi_undeploy,
                           name="iscsiundeploy"))
