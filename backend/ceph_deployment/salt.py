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
from ceph_deployment.conf import settings as ceph_deployment_settings
from systemd import get_dbus_object
from utilities import aggregate_dict

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


def get_config():
    """
    Returns a list of all minions, where each minion
    is a dict of the pillar data, e.g.
        * ip-address,
        * hostname
        * role
        * cluster fsid
        * key_accepted (boolean)
        * roles
    May be similar to:

    >>> subprocess.check_output(['salt', '*', 'pillar.items'])

    """
    out = salt_cmd().invoke_salt(['*', 'pillar.items'])
    return [
        aggregate_dict(data, hostname=hostname)
        for (hostname, data)
        in out.iteritems()
    ]

minion_roles = ['storage', 'mon', 'mds', 'rgw', 'master', 'admin']


def add_role(minion, role):
    """
    Adds a role to a given host. E.g. "storage", "mon", "mds", "rgw"
    Ceph cluster already set up. Afterwards, also edit the stack file.

    :type minion: str | unicode
    :type role: str
    """
    assert role in minion_roles
    filename = os.path.join(ceph_deployment_settings.DEEPSEA_PILLAR_ROOT, 'cluster',
                            minion + '.sls')

    with open(filename) as f:
        contents = yaml.safe_load(f)
    original_content = copy.deepcopy(contents)

    if 'roles' not in contents:
        contents['roles'] = [role]
    elif role not in contents['roles']:
        contents['roles'].append(role)
    else:
        return  # already present

    dumper = yaml.SafeDumper
    dumper.ignore_aliases = lambda self, data: True
    content = yaml.dump(contents, Dumper=dumper, default_flow_style=False)
    get_dbus_object("/ceph_deployment").write_pillar_file(filename, content)
    try:
        validate_pillar_data()
    except ValidationError:
        print "resetting"
        old_content = yaml.dump(original_content, Dumper=dumper, default_flow_style=False)
        get_dbus_object("/ceph_deployment").write_pillar_file(filename, old_content)
        raise


def set_storage_configuration(hostname, storage_configuration):
    """
    Sets the storage configuration as returned by
    get_possible_storage_configurations()
    """
    pass


def get_possible_storage_configurations(hostname):
    """
    Returns a list of proposals, of how this node
    could be configured.
    """
    pass


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


def validate_pillar_data():
    out = salt_cmd().invoke_salt_run_quiet(['validate.pillars'])

    def format_errors(name, errors):
        return [
            "{}: {}: {}".format(name, key, '\n'.join(error))
            for key, error
            in errors.items()
        ]

    def format_cluster(name, cluster):
        if 'errors' in cluster:
            return format_errors(name, cluster['errors'])
        else:
            return []

    all_errors = list(
        chain.from_iterable([format_cluster(name, cluster) for name, cluster in out.items()]))
    if all_errors:
        raise ValidationError({'detail': all_errors})



