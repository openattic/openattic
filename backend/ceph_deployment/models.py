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

from django.core.exceptions import ValidationError

from ceph.models import CephCluster
from ceph_deployment import deepsea
from ceph_deployment import salt
from django.db import models

from ceph_deployment.deepsea import policy_cfg, PolicyCfg  # PolicyCfg needed for type info
from exception import NotSupportedError
from nodb.models import NodbModel, JsonField, bulk_attribute_setter
from utilities import aggregate_dict, zip_by_key


class CephMinion(NodbModel):

    KEY_STATE_ACCEPTED = 'accepted'
    KEY_STATE_REJECTED = 'rejected'
    KEY_STATE_DENIED = 'denied'
    KEY_STATE_PRE = 'pre'
    KEY_STATES = [
        KEY_STATE_ACCEPTED, KEY_STATE_REJECTED, KEY_STATE_DENIED, KEY_STATE_PRE
    ]

    hostname = models.CharField(max_length=250, primary_key=True, editable=False)
    public_address = models.CharField(max_length=100, null=True, blank=True, editable=False)
    cluster = models.ForeignKey(CephCluster, blank=True, null=True)
    public_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    cluster_network = models.CharField(max_length=100, blank=True, null=True, editable=False)
    key_status = models.CharField(max_length=100,
                                  choices=[(c, c) for c in KEY_STATES])  # TODO rename to key_state
    roles = JsonField(base_type=list, null=True, blank=True)
    storage = JsonField(base_type=dict, null=True, blank=True)
    mon_initial_members = JsonField(base_type=list, editable=False, null=True, blank=True)
    mon_host = JsonField(base_type=list, editable=False, null=True, blank=True)
    hardware_profile = models.CharField(max_length=100, null=True, blank=True, editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is None

        hosts = salt.get_salt_minions()

        return [CephMinion(**CephMinion.make_model_args(host))
                for host
                in hosts]

    @bulk_attribute_setter( ['public_address', 'role', 'cluster_id', 'public_network',
                    'cluster_network', 'key_status', 'roles', 'storage', 'mon_host', 'mon_initial_members'])
    def set_deepse_pillar(self, objects, field_names):
        ceph_minions = deepsea.get_config()

        minions = zip_by_key('hostname', [{'hostname': o.hostname, 'obj': o} for o in objects], ceph_minions)
        for minion in minions:
            cluster_id = minion['fsid'] if 'fsid' in minion else None
            args = CephMinion.make_model_args(aggregate_dict(minion, cluster_id=cluster_id),
                                              fields_force_none=field_names)
            for key, value in args.items():
                setattr(minion['obj'], key, value)

    @bulk_attribute_setter(['hardware_profile'])
    def set_hardware_profile(self, objects, field_names):
        minion_names = [obj.hostname for obj in objects]
        with policy_cfg(minion_names, read_only=True) as cfg: # type: PolicyCfg
            profiles = aggregate_dict(*[{minion: profile for minion in minions}
                                        for profile, minions in cfg.hardware_profiles.items()])

        for obj in objects:
            obj.hardware_profile = profiles.get(obj.hostname)



    def save(self, *args, **kwargs):
        """
        This method implements three purposes.

        1. Implements the functionality originally done by django (e.g. setting id on self)
        2. Modify the Salt and DeepSea in a sane way.
        3. Providing a RESTful API.
        """
        insert = self._state.adding  # there seems to be no id field.
        if insert:
            raise NotSupportedError('Adding Minions is not supported.')

        diff, original = self.get_modified_fields()
        self.set_read_only_fields(original)

        for key, value in diff.items():
            if key == 'roles':
                new_roles = set(value).difference(original.roles)
                for role in new_roles:
                    salt.add_role(self.hostname, role)
            if key == 'key_status' and value in [CephMinion.KEY_STATE_ACCEPTED,
                                                 CephMinion.KEY_STATE_REJECTED]:
                salt.set_key_state(self.hostname, value)
            else:
                raise ValidationError({key: 'Tried to set "{}" to "{}" on Minion "{}", which is '
                                            'not supported'.format(key, value, self.hostname)})

        super(CephMinion, self).save(*args, **kwargs)
