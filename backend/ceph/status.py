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

from ceph.librados import ClusterConf
from module_status import Reason, UnavailableModule

logger = logging.getLogger(__name__)


def check_keyring_permission(keyring):
    try:
        keyring._check_access()
    except RuntimeError as e:
        raise UnavailableModule(Reason.OPENATTIC_CEPH_NO_CLUSTER_FOUND, e.message)


def check_ceph_api(fsid):
    try:
        cluster = ClusterConf.from_fsid(fsid)
        with cluster.client as client:
            if not client.connected():
                raise UnavailableModule(Reason.OPENATTIC_CEPH_NO_CONNECTION,
                                        {'fsid': fsid, 'cluster_name': cluster.name})
    except LookupError:
        raise UnavailableModule(Reason.OPENATTIC_CEPH_NO_CLUSTER_FOUND, {'fsid': fsid})


def status(params):
    configs = ClusterConf.all_configs()
    for conf in configs:
        check_keyring_permission(conf.keyring)
        check_ceph_api(conf.fsid)
