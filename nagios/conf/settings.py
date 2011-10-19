# -*- coding: utf-8 -*-

from django.conf import settings

LV_WARN_LEVEL       = getattr( settings, "NAGIOS_LV_WARN_LEVEL",     85 )
LV_CRIT_LEVEL       = getattr( settings, "NAGIOS_LV_WARN_LEVEL",     95 )
LV_DESCRIPTION      = getattr( settings, "NAGIOS_LV_DESCRIPTION",    "Disk Utilization for %s" )
LV_CHECK_CMD        = getattr( settings, "NAGIOS_LV_CHECK_CMD",      "check_disk" )

RRD_PATH            = getattr( settings, "NAGIOS_RRD_PATH",          "/var/lib/pnp4nagios/perfdata/localhost/%s.rrd" )
