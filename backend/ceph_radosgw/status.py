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

from deepsea import DeepSea
from module_status import Reason, check_deepsea_connection, UnavailableModule
from rest_client import RequestException
from ceph_radosgw.conf import settings
from ceph_radosgw.rgw_client import RGWClient


logger = logging.getLogger(__name__)


def check_rgw_credentials():
    if not all((settings.RGW_API_HOST, settings.RGW_API_PORT, settings.RGW_API_SCHEME,
                settings.RGW_API_ADMIN_RESOURCE, settings.RGW_API_ACCESS_KEY,
                settings.RGW_API_SECRET_KEY)):
        try:
            check_deepsea_connection()
        except UnavailableModule as ex:
            raise UnavailableModule(Reason.OPENATTIC_RGW_NO_DEEPSEA_CONN,
                                    {'deepsea_status': {'reason': ex.reason,
                                                        'messsage': ex.message}})
        try:
            credentials = DeepSea.instance().get_rgw_api_credentials()
            if not credentials:
                raise UnavailableModule(Reason.OPENATTIC_RGW_NO_DEEPSEA_CRED, None)
        except RequestException as ex:
            raise UnavailableModule(Reason.OPENATTIC_RGW_NO_DEEPSEA_CRED, str(ex))

    return {'available': True}


def check_rgw_connection():
    def map_errno_to_reason(errno):
        _table = {
            '111': Reason.RGW_CONNECTION_REFUSED,
            '-2': Reason.RGW_UNKNOWN_HOST,
            '110': Reason.RGW_CONNECTION_TIMEOUT,
            '113': Reason.RGW_NO_ROUTE_TO_HOST,
        }
        raise UnavailableModule(
            _table[errno] if errno in _table else Reason.RGW_CONN_UNKNOWN_PROBLEM,
            None)

    def map_status_code(status_code, message=None):
        _table = {
            '401': Reason.RGW_FAILED_AUTHENTICATION,
            '403': Reason.RGW_FAILED_AUTHENTICATION,
            '500': Reason.RGW_INTERNAL_SERVER_ERROR,
        }
        if str(status_code) not in _table:
            raise UnavailableModule(Reason.RGW_HTTP_PROBLEM,
                                    "RGW server returned status_code={}".format(status_code))
        raise UnavailableModule(_table[str(status_code)], message)

    try:
        online = RGWClient.admin_instance().is_service_online()
        if not online:
            raise UnavailableModule(Reason.RGW_HTTP_PROBLEM, "Unexpected RGW response output")
    except RequestException as ex:
        if ex.conn_errno and ex.conn_strerror:
            return map_errno_to_reason(ex.conn_errno)
        elif ex.status_code:
            return map_status_code(
                ex.status_code, ex.content if ex.status_code == 500 else None)
        raise UnavailableModule(Reason.RGW_HTTP_PROBLEM, str(ex))


def status(params):
    check_rgw_credentials()
    check_rgw_connection()
