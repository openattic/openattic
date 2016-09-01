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

import ast
import subprocess


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
    def fixup_minion_config(minion):
        config = minion.values()[0]
        config['hostname'] = minion.keys()[0]
        return config

    # lines = subprocess.check_output(['salt', '--out=raw', '\'*\'', 'pillar.items'], shell=True).splitlines()
    lines = subprocess.check_output('salt').splitlines()
    return [fixup_minion_config(ast.literal_eval(l)) for l in lines]


def add_role(hostname, role):
    """
    Adds a role to a given host. E.g. "storage", "mon", "mds", "rgw"
    """
    pass


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


def accept_key(hostname):
    """
    Accepts this minion's key
    """
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
    pass


def register_salt_eventbus_callback(callback):
    pass


def initialize_cluster(name):
    """
    initializes a new Ceph cluster. E.g. creates a
    config, creates the keys.
    """
    pass
