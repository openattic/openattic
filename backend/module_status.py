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
from __future__ import absolute_import

from distutils.version import StrictVersion
from importlib import import_module
from deepsea import DeepSea
from rest_client import RequestException
from rest_framework.views import APIView
from rest_framework.response import Response


class Reason(object):
    '''
    This class contains an enumeration of the reason codes for all kinds
    of failures of all modules.
    '''
    UNKNOWN = 100

    DEEPSEA_CONN_UNKNOWN_PROBLEM = 101
    DEEPSEA_CONNECTION_REFUSED = 102
    DEEPSEA_UNKNOWN_HOST = 103
    DEEPSEA_CONNECTION_TIMEOUT = 104
    DEEPSEA_NO_ROUTE_TO_HOST = 105
    DEEPSEA_FAILED_AUTHENTICATION = 106
    DEEPSEA_INTERNAL_SERVER_ERROR = 107
    DEEPSEA_HTTP_PROBLEM = 108
    DEEPSEA_INCOMPLETE_CONFIGURATION = 109

    DEEPSEA_NFS_UNKNOWN_PROBLEM = 120
    DEEPSEA_NFS_RUNNER_ERROR = 121
    DEEPSEA_NFS_NO_HOSTS = 122
    DEEPSEA_NFS_NO_FSALS = 123

    OPENATTIC_NFS_NO_CEPHFS = 131
    OPENATTIC_NFS_NO_RGW = 132

    DEEPSEA_ISCSI_UNKNOWN_PROBLEM = 140
    DEEPSEA_ISCSI_RUNNER_ERROR = 141
    DEEPSEA_ISCSI_NO_INTERFACES = 142

    OPENATTIC_CEPH_NO_CONNECTION = 151
    OPENATTIC_CEPH_NO_CLUSTER_FOUND = 152

    RGW_CONN_UNKNOWN_PROBLEM = 160
    RGW_CONNECTION_REFUSED = 161
    RGW_UNKNOWN_HOST = 163
    RGW_CONNECTION_TIMEOUT = 164
    RGW_NO_ROUTE_TO_HOST = 165
    RGW_FAILED_AUTHENTICATION = 166
    RGW_INTERNAL_SERVER_ERROR = 167
    RGW_HTTP_PROBLEM = 168
    RGW_NOT_SYSTEM_USER = 169

    OPENATTIC_RGW_NO_DEEPSEA_CONN = 171
    OPENATTIC_RGW_NO_DEEPSEA_CRED = 172

    GRAFANA_INCOMPLETE_CREDENTIALS = 180
    GRAFANA_FAILED_AUTHENTICATION = 181
    GRAFANA_CONNECTION_REFUSED = 182
    GRAFANA_UNKNOWN_HOST = 183
    GRAFANA_CONNECTION_TIMEOUT = 184
    GRAFANA_NO_ROUTE_TO_HOST = 185
    GRAFANA_CONNECTION_ERROR = 186
    GRAFANA_HTTP_ERROR = 187

    DEEPSEA_OLD_VERSION = 190


def check_deepsea_connection():
    def map_errno_to_reason(errno):
        _table = {
            '111': Reason.DEEPSEA_CONNECTION_REFUSED,
            '-2': Reason.DEEPSEA_UNKNOWN_HOST,
            '110': Reason.DEEPSEA_CONNECTION_TIMEOUT,
            '113': Reason.DEEPSEA_NO_ROUTE_TO_HOST,
        }
        raise UnavailableModule(
            _table[errno] if errno in _table else Reason.DEEPSEA_CONN_UNKNOWN_PROBLEM,
            None)

    def map_status_code(status_code, message=None):
        _table = {
            '401': Reason.DEEPSEA_FAILED_AUTHENTICATION,
            '403': Reason.DEEPSEA_FAILED_AUTHENTICATION,
            '500': Reason.DEEPSEA_INTERNAL_SERVER_ERROR,
        }
        if str(status_code) not in _table:
            raise UnavailableModule(Reason.DEEPSEA_HTTP_PROBLEM,
                                    "DeepSea server returned status_code={}".format(status_code))
        raise UnavailableModule(_table[str(status_code)], message)

    if not DeepSea.instance().is_configured():
        raise UnavailableModule(Reason.DEEPSEA_INCOMPLETE_CONFIGURATION)

    try:
        online = DeepSea.instance().is_service_online()
        if not online:
            raise UnavailableModule(Reason.DEEPSEA_HTTP_PROBLEM,
                                    "Unexpected DeepSea response output")
    except RequestException as ex:
        if ex.conn_errno and ex.conn_strerror:
            return map_errno_to_reason(ex.conn_errno)
        elif ex.status_code:
            return map_status_code(
                ex.status_code, ex.content if ex.status_code == 500 else None)
        raise UnavailableModule(Reason.DEEPSEA_HTTP_PROBLEM, str(ex))


def check_deepsea_version(min_version):
    message = "Minimum DeepSea version required is {}".format(min_version)
    try:
        deepsea_version = DeepSea.instance().get_deepsea_version()
        if not 'version' in deepsea_version:
            raise UnavailableModule(Reason.DEEPSEA_OLD_VERSION, message)
        version = deepsea_version['version']
        if not version:
            raise UnavailableModule(Reason.DEEPSEA_OLD_VERSION, message)
        if StrictVersion(version) < StrictVersion(min_version):
            raise UnavailableModule(Reason.DEEPSEA_OLD_VERSION, message)
    except RequestException:
        raise UnavailableModule(Reason.DEEPSEA_OLD_VERSION, message)


class UnavailableModule(Exception):
    def __init__(self, reason, message=None):
        super(UnavailableModule, self).__init__()
        self.reason = reason
        self.message = message


def unavailable_response(reason, message):
    """
    Returns a simple response:

    >>> unavailable_response(42, 'message').data
    {'available': False, 'reason': 42, 'message': 'message'}

    >>> unavailable_response(42, {'k': 'v'}).data
    {'available': False, 'reason': 42, 'k': 'v'}
    """
    resp = {
        'available': False,
        'reason': reason,
    }
    if isinstance(message, dict):
        for key, val in message.items():
            resp[key] = val
    else:
        resp['message'] = message
    return Response(resp)


def available_response():
    return Response({'available': True})


class StatusView(APIView):
    def get(self, request, module_name):
        if module_name:
            try:
                import_module(module_name)
            except ImportError:
                return Response({'message': 'Module "{}" not found'.format(module_name),
                                 'available': False}, status=404)

            try:
                module = import_module('{}.status'.format(module_name))
            except ImportError:
                return available_response()

            try:
                if getattr(module, 'status') is None:
                    return Response({
                        'message': 'Missing function `status` in module `{}`'.format(module_name),
                        'available': False,
                    }, status=500)

                module.status(request.GET)

                return available_response()

            except UnavailableModule as ex:
                return unavailable_response(ex.reason, ex.message)
