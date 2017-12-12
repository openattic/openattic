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
from deepsea import DeepSea
from taskqueue.models import task


@task(description='iSCSI deploy exports',
      metadata=lambda minions=None: {'hosts': minions if minions is not None else []})
def async_deploy_exports(minions=None):
    if minions is None:
        minions = []
    return DeepSea.instance().iscsi_deploy(minions)


@task(description='iSCSI stop exports',
      metadata=lambda minions=None: {'hosts': minions if minions is not None else []})
def async_stop_exports(minions=None):
    if minions is None:
        minions = []
    return DeepSea.instance().iscsi_undeploy(minions)
