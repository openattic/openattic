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
from itertools import chain

from django.core.exceptions import ValidationError
from django.utils.functional import cached_property

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
    hardware_profile = models.CharField(max_length=100, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):
        assert context is None

        hosts = salt.get_salt_minions()

        return [CephMinion(**CephMinion.make_model_args(host))
                for host
                in hosts]

    @bulk_attribute_setter(['public_address', 'public_network', 'cluster_network',
                            'key_status', 'storage', 'mon_host', 'mon_initial_members'])
    def set_deepse_pillar(self, objects, field_names):
        ceph_minions = deepsea.get_config()

        minions = zip_by_key('hostname', [{'hostname': o.hostname, 'obj': o} for o in objects],
                             ceph_minions)
        for minion in minions:
            cluster_id = minion['fsid'] if 'fsid' in minion else None
            args = CephMinion.make_model_args(aggregate_dict(minion, cluster_id=cluster_id),
                                              fields_force_none=field_names)
            for key, value in args.items():
                setattr(minion['obj'], key, value)

    @bulk_attribute_setter(['hardware_profile', 'roles', 'cluster_id'])
    def set_from_policy_cfg(self, objects, field_names):
        minion_names = [obj.hostname for obj in objects]
        cluster_map = {c.name: c.fsid for c in CephCluster.objects.all()}
        with policy_cfg(minion_names, read_only=True) as cfg:  # type: PolicyCfg
            profiles = aggregate_dict(*[{minion: profile for minion in minions}
                                        for profile, minions in cfg.hardware_profiles.items()])
            clusters = aggregate_dict(*[{minion: profile for minion in minions}
                                        for profile, minions in cfg.cluster_assignment.items()])
            roles = chain.from_iterable([[(minion, role) for minion in minions]
                                        for role, minions in cfg.cluster_assignment.items()])

        for obj in objects:
            obj.hardware_profile = profiles.get(obj.hostname)
            cluster_name = clusters.get(obj.hostname)
            obj.cluster_id = cluster_map[
                cluster_name] if cluster_name in cluster_map.keys() else None
            obj.roles = [role for minion, role in roles if minion == obj.hostname]
            if obj.hardware_profile:
                obj.roles.append('storage')  # because, "storage" is not a real role.

    @cached_property
    def all_minion_names(self):
        return [m['hostname'] for m in salt.get_salt_minions()]

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
                try:
                    new_roles = set(value).difference(original.roles + ['storage'])
                except TypeError:
                    new_roles = []
                with policy_cfg(self.all_minion_names) as cfg:  # type: PolicyCfg
                    cfg.set_roles(self.hostname, new_roles)
            elif key == 'key_status' and value in [CephMinion.KEY_STATE_ACCEPTED,
                                                   CephMinion.KEY_STATE_REJECTED]:
                salt.set_key_state(self.hostname, value)
            elif key == 'cluster_id':
                with policy_cfg(self.all_minion_names) as cfg:  # type: PolicyCfg
                    new_cluster = None if value is None else CephCluster.objects.get(pk=value).name
                    cfg.set_cluster_assignment(self.hostname, new_cluster)
            elif key == 'hardware_profile':
                with policy_cfg(self.all_minion_names) as cfg:  # type: PolicyCfg
                    cfg.set_hardware_profiles(self.hostname, value)
            else:
                raise ValidationError({key: 'Tried to set "{}" to "{}" on Minion "{}", which is '
                                            'not supported'.format(key, value, self.hostname)})

        super(CephMinion, self).save(*args, **kwargs)
