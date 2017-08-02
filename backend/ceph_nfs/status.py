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

from ceph.models import CephCluster
from ceph_radosgw.rgw_client import RGWClient
from deepsea import DeepSea
from module_status import Reason, check_deepsea_connection, UnavailableModule
from rest_client import RequestException

logger = logging.getLogger(__name__)


def check_cephfs_api(fsid):
    try:
        cluster = CephCluster.objects.get(fsid=fsid)
        try:
            from ceph_nfs.cephfs_util import CephFSUtil
            from cephfs import Error
            CephFSUtil.instance(cluster).get_dir_list('/', 1)
        except (Error, OSError) as e:
            raise UnavailableModule(Reason.OPENATTIC_NFS_NO_CEPHFS, str(e))
    except LookupError:
        raise UnavailableModule(Reason.OPENATTIC_CEPH_NO_CLUSTER_FOUND, {'fsid': fsid})


def check_deepsea_nfs_api(fsid):
    def map_status_code(status_code, resp_content):
        _table = {
            '401': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
            '403': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
            '500': (Reason.DEEPSEA_NFS_RUNNER_ERROR, resp_content)
        }
        if str(status_code) not in _table:
            raise UnavailableModule(Reason.DEEPSEA_NFS_UNKNOWN_PROBLEM,
                                    "DeepSea server returned status_code={}, content=\n{}"
                                    .format(status_code, resp_content))
        raise UnavailableModule(*_table[str(status_code)])

    try:
        hosts = DeepSea.instance().nfs_get_hosts()
        if not hosts:
            raise UnavailableModule(Reason.DEEPSEA_NFS_NO_HOSTS,
                                    "No hosts found with ganesha role")

        fsals = DeepSea.instance().nfs_get_fsals_available()
        if not fsals:
            raise UnavailableModule(Reason.DEEPSEA_NFS_NO_FSALS,
                                    "No fsals supported by this cluster")
        if fsals == ['CEPH']:
            check_cephfs_api(fsid)
        elif fsals == ['RGW']:
            try:
                if not RGWClient.admin_instance().is_service_online():
                    raise UnavailableModule(Reason.OPENATTIC_NFS_NO_RGW, None)
                if not RGWClient.admin_instance().is_system_user():
                    raise UnavailableModule(Reason.OPENATTIC_NFS_NO_RGW, None)
            except (RGWClient.NoCredentialsException, RequestException) as e:
                raise UnavailableModule(Reason.OPENATTIC_NFS_NO_RGW, str(e))
    except RequestException as e:
        if e.status_code:
            return map_status_code(e.status_code, e.content)
        raise UnavailableModule(Reason.DEEPSEA_NFS_UNKNOWN_PROBLEM, str(e))


def status(params):
    if 'fsid' not in params:
        raise ValidationError("fsid parameter is required")

    check_deepsea_connection()
    check_deepsea_nfs_api(params['fsid'])
