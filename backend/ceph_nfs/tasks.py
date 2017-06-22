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


@task(description='NFS-Ganesha get exports status')
def async_status_exports():
    return DeepSea.instance().nfs_status_exports()


@task(description='NFS-Ganesha deploy exports', metadata=lambda minion: {'host': minion})
def async_deploy_exports(minion=None):
    return DeepSea.instance().nfs_deploy_exports(minion)


@task(description='NFS-Ganesha stop exports', metadata=lambda minion: {'host': minion})
def async_stop_exports(minion=None):
    return DeepSea.instance().nfs_stop_exports(minion)
