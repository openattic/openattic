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
from rest_framework import serializers

from ceph_deployment import deepsea
from ceph_deployment.models import CephMinion
from nodb.restapi import NodbSerializer, NodbViewSet


class CephMinionSerializer(NodbSerializer):

    class Meta(object):
        model = CephMinion


class CephMinionViewSet(NodbViewSet):
    """
    Ceph Minions
    """

    serializer_class = CephMinionSerializer
    lookup_value_regex = r'[^/]+'

    def get_queryset(self):
        return CephMinion.objects.all()

    @staticmethod
    def validate_hardware_profile(value):
        if value is not None:
            profiles = deepsea.get_possible_storage_configurations()
            if value not in profiles:
                raise serializers.ValidationError('Hardware profile not in {}.'.format(profiles))
        return value

RESTAPI_VIEWSETS = [
    ('cephminions', CephMinionViewSet, 'cephminion'),
]
