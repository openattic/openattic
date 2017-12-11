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
import settings

from django.core.exceptions import ValidationError

from ceph.status import check_ceph_api
from deepsea import DeepSea
from module_status import check_deepsea_connection, check_deepsea_version, Reason, UnavailableModule
from rest_client import RequestException


logger = logging.getLogger(__name__)


def check_deepsea_iscsi_api():
    def map_status_code(status_code, resp_content):
        _table = {
            '401': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
            '403': (Reason.DEEPSEA_FAILED_AUTHENTICATION, None),
            '500': (Reason.DEEPSEA_ISCSI_RUNNER_ERROR, resp_content)
        }
        if str(status_code) not in _table:
            raise UnavailableModule(Reason.DEEPSEA_ISCSI_UNKNOWN_PROBLEM,
                                    "DeepSea server returned status_code={}, content=\n{}"
                                    .format(status_code, resp_content))
        raise UnavailableModule(*_table[str(status_code)])

    try:
        interfaces = DeepSea.instance().iscsi_interfaces()
        if not interfaces:
            raise UnavailableModule(Reason.DEEPSEA_ISCSI_NO_INTERFACES,
                                    "No hosts found with igw role")
    except RequestException as e:
        if e.status_code:
            return map_status_code(e.status_code, e.content)
        raise UnavailableModule(Reason.DEEPSEA_ISCSI_UNKNOWN_PROBLEM, str(e))


def status(params):
    if 'fsid' not in params:
        raise ValidationError("fsid parameter is required")

    check_deepsea_connection()
    check_deepsea_iscsi_api()
    check_deepsea_version(settings.DEEPSEA_MIN_VERSION_ISCSI)
    check_ceph_api(params['fsid'])
