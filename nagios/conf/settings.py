# -*- coding: utf-8 -*-

from django.conf import settings

LV_UTIL_WARN_LEVEL       = getattr( settings, "NAGIOS_LV_UTIL_WARN_LEVEL",     15 )
LV_UTIL_CRIT_LEVEL       = getattr( settings, "NAGIOS_LV_UTIL_WARN_LEVEL",      5 )
LV_UTIL_DESCRIPTION      = getattr( settings, "NAGIOS_LV_UTIL_DESCRIPTION",    "Disk Utilization for %s" )
LV_UTIL_CHECK_CMD        = getattr( settings, "NAGIOS_LV_UTIL_CHECK_CMD",      "check_disk" )

LV_PERF_DESCRIPTION      = getattr( settings, "NAGIOS_LV_PERF_DESCRIPTION",    "Disk stats for %s" )
LV_PERF_CHECK_CMD        = getattr( settings, "NAGIOS_LV_PERF_CHECK_CMD",      "check_diskstats" )

RRD_PATH                 = getattr( settings, "NAGIOS_RRD_PATH",          "/var/lib/pnp4nagios/perfdata/localhost/%s.rrd" )

GRAPH_GRCOLOR            = "222222"
GRAPH_BGCOLOR            = "1F2730"
GRAPH_FGCOLOR            = "FFFFFF"
GRAPH_BGIMAGE            = settings.MEDIA_ROOT + "/openattic_triangle_trans.png"
