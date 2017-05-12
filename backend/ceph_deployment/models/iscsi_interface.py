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
from django.db import models
from nodb.models import NodbModel, JsonField
from ceph_deployment.deepsea import DeepSea


class iSCSIInterface(NodbModel):
    hostname = models.CharField(max_length=250, primary_key=True, editable=False)
    interfaces = JsonField(base_type=list, editable=False, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):

        # currently context.fsid will be ignored because DeepSea still
        # does not support multiple Ceph clusters

        interfaces = DeepSea.instance().iscsi_interfaces()
        return [iSCSIInterface(**iSCSIInterface.make_model_args(i)) for i in interfaces]
