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

from rest_framework.response import Response
from rest_framework.decorators import list_route

from ceph_iscsi import tasks
from deepsea import DeepSea
from ceph_iscsi.lrbd_conf import LRBDUi
from ceph_iscsi.models import iSCSITarget
from ceph.restapi import FsidContext
from nodb.restapi import NodbSerializer, NodbViewSet

logger = logging.getLogger(__name__)


class iSCSITargetSerializer(NodbSerializer):
    class Meta(object):
        model = iSCSITarget


class iSCSITargetViewSet(NodbViewSet):
    serializer_class = iSCSITargetSerializer
    lookup_value_regex = r'iqn\.\d\d\d\d-\d\d\..+'
    search_fields = ('targetId', 'images__name', 'images__pool', 'portals__hostname',
                     'portals__interface')

    def __init__(self, **kwargs):
        super(iSCSITargetViewSet, self).__init__(**kwargs)
        self.set_nodb_context(FsidContext(self, 'ceph_iscsi'))

    def get_queryset(self):
        return iSCSITarget.objects.all()

    @list_route(methods=['post'])
    def bulk_delete(self, request, *args, **kwargs):
        targets = iSCSITarget.objects.all()
        status = DeepSea.instance().iscsi_status()

        if 'targetIds' not in request.DATA or not isinstance(request.DATA['targetIds'], list):
            logger.error("JSON input is not an array")
            raise Exception()

        targets_to_delete = [tid.strip() for tid in request.DATA['targetIds']]

        new_targets = [t for t in targets if t.targetId not in targets_to_delete]
        if len(new_targets) == len(targets):
            logger.info("No iSCSI target deleted")
            return Response()

        lrbd = LRBDUi(new_targets)
        if DeepSea.instance().iscsi_save(lrbd.lrbd_conf_json()):
            logger.info("Deleted iSCSI targets %s", targets_to_delete)
        else:
            logger.info("Failed to delete iSCSI targets %s", targets_to_delete)
            raise Exception('Failed to delete iSCSI targets')

        if new_targets and status:
            portals_to_deploy_lists = [t.portals for t in targets if t.targetId in targets_to_delete]
            portals_to_deploy = [val for sublist in portals_to_deploy_lists for val in sublist]
            minions = iSCSITarget.extract_hostnames(portals_to_deploy)
            task = tasks.async_deploy_exports.delay(list(minions))
            logger.info("Scheduled deploy of iSCSI exports: taskqueue_id=%s", task.id)
        elif status:
            task = tasks.async_stop_exports.delay()
            logger.info("Scheduled stop of iSCSI: taskqueue_id=%s", task.id)

        return Response()
