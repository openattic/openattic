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

import copy
import logging
from itertools import chain
import os
import subprocess

import yaml
from django.core.exceptions import ValidationError

from ceph_deployment.systemapi import salt_cmd

logger = logging.getLogger(__file__)


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


def apply_changes():  # TODO: Not sure this will work or is a good idea
    """
    Applies the modified values to the minions
    """
    pass


def get_running_jobs():
    """
    Returns a list of all jobs that are running at the moment.
    """
    return salt_cmd().invoke_salt_run(['jobs.active'])


def register_salt_eventbus_callback(callback):
    pass


def initialize_cluster(name):
    """
    initializes a new Ceph cluster. E.g. creates a
    config, creates the keys.
    """
    pass





