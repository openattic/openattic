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

from ceph_iscsi.models import iSCSIInterface
from ceph.restapi import FsidContext
from nodb.restapi import NodbSerializer, NodbViewSet


class iSCSIInterfaceSerializer(NodbSerializer):
    class Meta(object):
        model = iSCSIInterface


class iSCSIInterfaceViewSet(NodbViewSet):
    serializer_class = iSCSIInterfaceSerializer

    def __init__(self, **kwargs):
        super(iSCSIInterfaceViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph_iscsi'))

    def get_queryset(self):
        return iSCSIInterface.objects.all()
