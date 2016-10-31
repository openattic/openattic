# -*- coding: utf-8 -*-
"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
from itertools import chain

from ceph_deployment.systemapi import salt_cmd

logger = logging.getLogger(__name__)


def get_salt_minions():
    res = salt_cmd().invoke_salt_key(['-L'])
    flat = list(chain.from_iterable([
        [
            (hostname, key_status)
            for hostname
            in hostnames
        ]
        for key_status, hostnames
        in res.items()
    ]))
    return [
        {
            'hostname': hostname,
            'key_status': key_status[8:] if '_' in key_status else 'accepted'
        }
        for hostname, key_status
        in flat
    ]


def salt_has_active_jobs():
    return bool(get_running_jobs())





def set_key_state(hostname, state):
    """
    Accepts or rejects this minion's key
    """
    arg = {
        'accepted': '-a',
        'rejected': '-r',
    }[state]
    try:
        salt_cmd().invoke_salt_key(['-y', arg, hostname])
    except ValueError:
        pass


def get_running_jobs():
    """
    Returns a list of all jobs that are running at the moment.
    """
    return salt_cmd().invoke_salt_run(['jobs.active'])


def register_salt_eventbus_callback(callback):
    pass
