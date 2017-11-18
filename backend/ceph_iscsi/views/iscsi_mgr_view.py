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
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ceph_iscsi import tasks
from deepsea import DeepSea

logger = logging.getLogger(__name__)

@api_view(['GET'])
def iscsi_status(request):
    return Response(DeepSea.instance().iscsi_status())


@api_view(['POST'])
def iscsi_deploy(request):
    if 'minions' in request.DATA:
        minions = request.DATA['minions']
        my_task = tasks.async_deploy_exports.delay(minions)
    else:
        my_task = tasks.async_deploy_exports.delay()
    logger.info("Scheduled deploy of iSCSI exports: taskqueue_id=%s", my_task.id)
    return Response({'taskqueue_id': my_task.id})


@api_view(['POST'])
def iscsi_undeploy(request):
    if 'minions' in request.DATA:
        minions = request.DATA['minions']
        my_task = tasks.async_stop_exports.delay(minions)
    else:
        my_task = tasks.async_stop_exports.delay()
    logger.info("Scheduled stop of iSCSI: taskqueue_id=%s", my_task.id)
    return Response({'taskqueue_id': my_task.id})
