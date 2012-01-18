# -*- coding: utf-8 -*-

from django.conf import settings

LV_UTIL_DESCRIPTION      = getattr( settings, "NAGIOS_LV_UTIL_DESCRIPTION",    "Disk Utilization for %s" )
LV_UTIL_CHECK_CMD        = getattr( settings, "NAGIOS_LV_UTIL_CHECK_CMD",      "check_disk" )

LV_PERF_DESCRIPTION      = getattr( settings, "NAGIOS_LV_PERF_DESCRIPTION",    "Disk stats for %s" )
LV_PERF_CHECK_CMD        = getattr( settings, "NAGIOS_LV_PERF_CHECK_CMD",      "check_diskstats" )

LV_SNAP_DESCRIPTION      = getattr( settings, "NAGIOS_LV_SNAP_DESCRIPTION",    "Snapshot Utilization of %s" )
LV_SNAP_CHECK_CMD        = getattr( settings, "NAGIOS_LV_SNAP_CHECK_CMD",      "check_lvm_snapshot" )

TRAFFIC_DESCRIPTION      = getattr( settings, "NAGIOS_TRAFFIC_DESCRIPTION",    "Traffic on %s" )
TRAFFIC_CHECK_CMD        = getattr( settings, "NAGIOS_TRAFFIC_CHECK_CMD",      "check_protocol_traffic" )

CPUTIME_DESCRIPTION      = getattr( settings, "NAGIOS_CPUTIME_DESCRIPTION",    "CPU Time for CPU %d" )
CPUTIME_CHECK_CMD        = getattr( settings, "NAGIOS_CPUTIME_CHECK_CMD",      "check_cputime" )

RRD_PATH                 = getattr( settings, "NAGIOS_RRD_PATH",          "/var/lib/pnp4nagios/perfdata/localhost/%s.rrd" )

GRAPH_GRCOLOR            = "222222"
GRAPH_BGCOLOR            = "1F2730"
GRAPH_FGCOLOR            = "FFFFFF"
GRAPH_BGIMAGE            = settings.MEDIA_ROOT + "/openattic_triangle_trans.png"
