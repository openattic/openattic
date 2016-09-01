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
from ceph_deployment import salt
from django.db import models
from nodb.models import NodbModel, JsonField


class CephMinion(NodbModel):

    hostname = models.CharField(max_length=250, primary_key=True)
    ip_address = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    cluster = models.CharField(max_length=100, blank=True, null=True)
    fsid = models.CharField(max_length=100, blank=True, null=True)
    public_network = models.CharField(max_length=100, blank=True, null=True)
    key_accepted = models.BooleanField(default=False)
    roles = JsonField(base_type=list, editable=False)
    storage = JsonField(base_type=dict, editable=False)

    @staticmethod
    def get_all_objects(context, query):
        assert context is None

        hosts = salt.get_config()

        return [CephMinion(**CephMinion.make_model_args(host))
                for host
                in hosts]
