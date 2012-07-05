# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import statgrab
from rpcd.handlers import BaseHandler

class HostStatsHandler(BaseHandler):
    handler_name = "hoststats.HostStats"

    def get_host_info(self):
        """ Return some general information about this host. """
        return statgrab.sg_get_host_info().attrs

    def get_load(self):
        """ Return system load statistics. """
        return statgrab.sg_get_load_stats().attrs

    def get_uptime(self):
        """ Return the uptime in seconds. """
        return statgrab.sg_get_host_info().uptime

    def get_cpu(self):
        """ Return current CPU utilization info. """
        return statgrab.sg_get_cpu_percents().attrs

    def get_mem(self):
        """ Return current memory utilization info. """
        stat = statgrab.sg_get_mem_stats()
        return { 'used': (stat.used - stat.cache), 'cache': stat.cache, 'free': stat.free}

RPCD_HANDLERS = [HostStatsHandler]
