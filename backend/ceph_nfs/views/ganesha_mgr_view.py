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

from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from deepsea import DeepSea
from ceph_nfs import tasks
try:
    from ceph_nfs.cephfs_util import CephFSUtil
    import cephfs as libcephfs
except ImportError:
    CephFSUtil = None
from ceph_radosgw.rgw_client import RGWClient
from rest_client import RequestException
from ceph.models import CephCluster
from ceph.restapi import FsidContext


logger = logging.getLogger(__name__)


@api_view(['GET'])
def hosts(request):
    return Response({'hosts': DeepSea.instance().nfs_get_hosts()})


@api_view(['GET'])
def fsals(request):
    res = DeepSea.instance().nfs_get_fsals_available()
    if 'CEPH' in res:
        if not CephFSUtil:
            res = [f for f in res if f != 'CEPH']
        else:
            cluster = FsidContext(request=request, module_name='ceph_nfs').cluster
            try:
                if not CephFSUtil.instance(cluster).status():
                    res = [f for f in res if f != 'CEPH']
            except libcephfs.PermissionError:
                res = [f for f in res if f != 'CEPH']
    if 'RGW' in res:
        try:
            if not RGWClient.admin_instance().is_service_online():
                res = [f for f in res if f != 'RGW']
            if not RGWClient.admin_instance().is_system_user():
                res = [f for f in res if f != 'RGW']
        except (RGWClient.NoCredentialsException, RequestException):
            res = [f for f in res if f != 'RGW']
    return Response({'fsals': res})


@api_view(['GET'])
def status(request):
    return Response(DeepSea.instance().nfs_status_exports())


@api_view(['POST'])
def deploy(request):
    if 'host' in request.DATA:
        host = request.DATA['host']
        my_task = tasks.async_deploy_exports.delay(host)
    else:
        my_task = tasks.async_deploy_exports.delay()
        logger.info("Scheduled deploy of NFS exports: taskqueue_id=%s", my_task.id)
    return Response({'taskqueue_id': my_task.id})


@api_view(['POST'])
def stop(request):
    if 'host' in request.DATA:
        host = request.DATA['host']
        my_task = tasks.async_stop_exports.delay(host)
        logger.info("Scheduled stop of NFS exports for host=%s: taskqueue_id=%s", host, my_task.id)
    else:
        my_task = tasks.async_stop_exports.delay()
        logger.info("Scheduled stop of NFS exports: taskqueue_id=%s", my_task.id)
    return Response({'taskqueue_id': my_task.id})


@api_view(['GET'])
def ls_dir(request):
    if 'root_dir' in request.GET:
        root = request.GET['root_dir']
    else:
        root = "/"
    if 'depth' in request.GET:
        depth = int(request.GET['depth'])
    else:
        depth = 1
    if depth > 5:
        logger.warning("Limiting depth to maximum value of 5: input depth=%s", depth)
        depth = 5
    root = '{}/'.format(root) if not root.endswith('/') else root

    try:
        cluster = FsidContext(request=request, module_name='ceph_nfs').cluster
        paths = CephFSUtil.instance(cluster).get_dir_list(root, depth)
        paths = [p[:-1] for p in paths if p != root]
        return Response({'paths': paths})
    except libcephfs.ObjectNotFound, libcephfs.PermissionError:
        return Response({'paths': []})


@api_view(['GET'])
def buckets(request):
    if 'userid' not in request.GET:
        raise ValidationError('No userid parameter provided')
    try:
        return Response({'buckets': RGWClient.instance(request.GET['userid']).get_buckets()})
    except RequestException as e:
        logger.error(e)
        return Response({'buckets': []})
