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

from rest_framework.views import APIView
from rest_framework.response import Response
from deepsea import DeepSea
from rest_client import RequestException
from ceph_radosgw.rgw_client import RGWClient
from ceph.restapi import FsidContext


logger = logging.getLogger(__name__)


class Reason(object):
    UNKNOWN = 100

    DEEPSEA_CONN_UNKNOWN_PROBLEM = 101
    DEEPSEA_CONNECTION_REFUSED = 102
    DEEPSEA_UNKNOWN_HOST = 103
    DEEPSEA_CONNECTION_TIMEOUT = 104
    DEEPSEA_NO_ROUTE_TO_HOST = 105
    DEEPSEA_FAILED_AUTHENTICATION = 106
    DEEPSEA_INTERNAL_SERVER_ERROR = 107
    DEEPSEA_HTTP_PROBLEM = 108

    DEEPSEA_NFS_UNKNOWN_PROBLEM = 120
    DEEPSEA_NFS_RUNNER_ERROR = 121
    DEEPSEA_NFS_NO_HOSTS = 122
    DEEPSEA_NFS_NO_FSALS = 123

    OPENATTIC_NFS_NO_CEPHFS = 131
    OPENATTIC_NFS_NO_RGW = 132


class StatusView(APIView):

    @staticmethod
    def gen_reason_response(reason, message):
        return {
            'available': False,
            'reason': reason,
            'message': message
        }

    @staticmethod
    def check_deepsea_connection():
        def map_errno_to_reason(errno):
            _table = {
                '111': Reason.DEEPSEA_CONNECTION_REFUSED,
                '-2': Reason.DEEPSEA_UNKNOWN_HOST,
                '110': Reason.DEEPSEA_CONNECTION_TIMEOUT,
                '113': Reason.DEEPSEA_NO_ROUTE_TO_HOST,
            }
            return StatusView.gen_reason_response(
                _table[errno] if errno in _table else Reason.DEEPSEA_CONN_UNKNOWN_PROBLEM,
                None)

        def map_status_code(status_code, message=None):
            _table = {
                '401': Reason.DEEPSEA_FAILED_AUTHENTICATION,
                '403': Reason.DEEPSEA_FAILED_AUTHENTICATION,
                '500': Reason.DEEPSEA_INTERNAL_SERVER_ERROR,
            }
            if str(status_code) not in _table:
                return StatusView.gen_reason_response(
                    Reason.DEEPSEA_HTTP_PROBLEM,
                    "DeepSea server returned status_code={}".format(status_code))
            return StatusView.gen_reason_response(_table[str(status_code)], message)

        try:
            online = DeepSea.instance().is_service_online()
            if not online:
                return StatusView.gen_reason_response(Reason.DEEPSEA_HTTP_PROBLEM,
                                                      "Unexpected DeepSea response output")
        except RequestException as ex:
            if ex.conn_errno and ex.conn_strerror:
                return map_errno_to_reason(ex.conn_errno)
            elif ex.status_code:
                return map_status_code(
                    ex.status_code, ex.content if ex.status_code == 500 else None)
            else:
                return StatusView.gen_reason_response(Reason.DEEPSEA_HTTP_PROBLEM, str(ex))

        return {'available': True}

    @staticmethod
    def check_deepsea_nfs_api(cluster_name):
        def map_status_code(status_code, resp_content):
            _table = {
                '401': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
                '403': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
                '500': (Reason.DEEPSEA_NFS_RUNNER_ERROR, resp_content)
            }
            if str(status_code) not in _table:
                return StatusView.gen_reason_response(
                    Reason.DEEPSEA_NFS_UNKNOWN_PROBLEM,
                    "DeepSea server returned status_code={}, content=\n{}"
                    .format(status_code, resp_content))
            return StatusView.gen_reason_response(*_table[str(status_code)])

        try:
            hosts = DeepSea.instance().nfs_get_hosts()
            if not hosts:
                return StatusView.gen_reason_response(Reason.DEEPSEA_NFS_NO_HOSTS,
                                                      "No hosts found with ganesha role")

            fsals = DeepSea.instance().nfs_get_fsals_available()
            if not fsals:
                return StatusView.gen_reason_response(Reason.DEEPSEA_NFS_NO_FSALS,
                                                      "No fsals supported by this cluster")
            if fsals == ['CEPH']:
                try:
                    from ceph_nfs.cephfs_util import CephFSUtil
                    CephFSUtil.instance(cluster_name).get_dir_list('/', 1)
                except Exception as e:
                    return StatusView.gen_reason_response(Reason.OPENATTIC_NFS_NO_CEPHFS,
                                                          str(e))
            elif fsals == ['RGW']:
                try:
                    if not RGWClient.admin_instance().is_service_online():
                        return StatusView.gen_reason_response(Reason.OPENATTIC_NFS_NO_RGW,
                                                              "unexpected output")
                except RGWClient.NoCredentialsException as e:
                    return StatusView.gen_reason_response(Reason.OPENATTIC_NFS_NO_RGW,
                                                          str(e))


        except RequestException as e:
            if e.status_code:
                return map_status_code(e.status_code, e.content)
            return StatusView.gen_reason_response(Reason.DEEPSEA_NFS_UNKNOWN_PROBLEM, str(e))

        return {'available': True}

    def get(self, request):
        cluster_name = FsidContext(request=request, module_name='ceph_nfs').cluster.name

        response = StatusView.check_deepsea_connection()
        if not response['available']:
            return Response(response)

        response = StatusView.check_deepsea_nfs_api(cluster_name)
        if not response['available']:
            return Response(response)

        return Response({'available': True})
