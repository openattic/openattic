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

from django.db import models

from ceph.models import CephCluster
from deepsea import DeepSea
from nodb.models import JsonField, NodbModel

logger = logging.getLogger(__name__)


class CephMinion(NodbModel):

    KEY_STATE_ACCEPTED = 'accepted'
    KEY_STATE_REJECTED = 'rejected'
    KEY_STATE_DENIED = 'denied'
    KEY_STATE_UNACCEPTED = 'unaccepted'
    KEY_STATES = [
        KEY_STATE_ACCEPTED, KEY_STATE_REJECTED, KEY_STATE_DENIED,
        KEY_STATE_UNACCEPTED
    ]

    hostname = models.CharField(max_length=250, primary_key=True, editable=False)
    public_address = models.CharField(max_length=100, null=True, blank=True, editable=False)
    cluster = models.ForeignKey(CephCluster, blank=True, null=True)
    public_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    cluster_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    key_status = models.CharField(max_length=100, choices=[(c, c) for c in KEY_STATES])
    roles = JsonField(base_type=list, null=True, blank=True)
    storage = JsonField(base_type=dict, null=True, blank=True)
    mon_initial_members = JsonField(base_type=list, editable=False, null=True, blank=True)
    mon_host = JsonField(base_type=list, editable=False, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):
        assert context is None

        minions = DeepSea.instance().get_minions()

        for minion in minions:
            minion['cluster_id'] = minion['fsid'] if 'fsid' in minion else None

        return [CephMinion(**CephMinion.make_model_args(host, ['public_address', 'storage', 'public_network', 'cluster_network', 'roles', 'mon_initial_members', 'mon_host']))
                for host in minions]
