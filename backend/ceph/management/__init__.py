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

from django.conf import settings

import sysutils.models

logger = logging.getLogger(__name__)


def update(**kwargs):

    if "nagios" in settings.INSTALLED_APPS:
        from systemd import get_dbus_object

        print('Updating Nagios configs: adding detected Ceph clusters ...'),

        ceph = get_dbus_object("/ceph")
        nagios = get_dbus_object("/nagios")

        try:
            ceph.remove_nagios_configs(["all"])
            ceph.write_cluster_nagios_configs()
            ceph.write_pool_nagios_configs()
            ceph.write_rbd_nagios_configs()
            nagios.restart_service()
            print('succeeded.')
        except Exception:
            print('failed. Please check the status of your cluster(s).')
            logger.warning('Can\'t create, update or delete Nagios configuration files because of inaccessible Ceph '
                           'cluster(s). Please check the status of your cluster(s).')
    else:
        print "Nagios does not appear to be installed, skipping adding Ceph clusters"


sysutils.models.post_install.connect(update, sender=sysutils.models)
