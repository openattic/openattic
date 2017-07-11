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
from module_status import UnavailableModule, Reason
from grafana_proxy import GrafanaProxy
from rest_client import RequestException


def check_grafana_connection():
    try:
        GrafanaProxy.instance().is_service_online()
    except RequestException as e:
        errno_to_grafana_code = {
            '111': Reason.GRAFANA_CONNECTION_REFUSED,
            '-2': Reason.GRAFANA_UNKNOWN_HOST,
            '110': Reason.GRAFANA_CONNECTION_TIMEOUT,
            '113': Reason.GRAFANA_NO_ROUTE_TO_HOST,
        }

        status_code_grafana_code = {
            401: Reason.GRAFANA_FAILED_AUTHENTICATION,
        }

        if e.conn_errno in errno_to_grafana_code:
            raise UnavailableModule(errno_to_grafana_code[e.conn_errno], e.conn_strerror)
        elif e.status_code in status_code_grafana_code:
            raise UnavailableModule(status_code_grafana_code[e.status_code])
        elif e.conn_errno:
            raise UnavailableModule(Reason.GRAFANA_CONNECTION_ERROR, {
                'code': e.conn_errno,
                'message': e.conn_strerror,
            })
        else:
            raise UnavailableModule(Reason.GRAFANA_HTTP_ERROR, {
                'status_code': e.status_code,
                'message': e.message,
                'content': e.content,
            })


def status(params):
    if not GrafanaProxy.has_credentials():
        raise UnavailableModule(Reason.GRAFANA_INCOMPLETE_CREDENTIALS)

    check_grafana_connection()
