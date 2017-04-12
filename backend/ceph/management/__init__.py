# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

from django.conf import settings

import sysutils.models


def update(**kwargs):

    if "nagios" in settings.INSTALLED_APPS:
        from systemd import get_dbus_object

        print "Updating Nagios configs: adding detected Ceph clusters"

        ceph = get_dbus_object("/ceph")
        nagios = get_dbus_object("/nagios")

        ceph.remove_nagios_configs(["all"])
        ceph.write_cluster_nagios_configs()
        ceph.write_pool_nagios_configs()
        ceph.write_rbd_nagios_configs()
        nagios.restart_service()
    else:
        print "Nagios does not appear to be installed, skipping adding Ceph clusters"


sysutils.models.post_install.connect(update, sender=sysutils.models)
