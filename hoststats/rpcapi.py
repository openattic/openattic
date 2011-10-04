# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import statgrab
from rpcd.handlers import BaseHandler

class HostStatsHandler(BaseHandler):
    @classmethod
    def _get_handler_name(cls):
        return "hoststats.HostStats"

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
        return statgrab.sg_get_cpu_percents().attrs

    def get_mem(self):
        stat = statgrab.sg_get_mem_stats()
        return { 'used': (stat.used - stat.cache), 'cache': stat.cache, 'free': stat.free}

RPCD_HANDLERS = [HostStatsHandler]
