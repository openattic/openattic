# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

LV_UTIL_DESCRIPTION      = getattr( settings, "NAGIOS_LV_UTIL_DESCRIPTION",    "Utilization for %s" )
LV_UTIL_CHECK_CMD        = getattr( settings, "NAGIOS_LV_UTIL_CHECK_CMD",      "check_volume_utilization" )

LV_PERF_DESCRIPTION      = getattr( settings, "NAGIOS_LV_PERF_DESCRIPTION",    "Disk stats for %s" )
LV_PERF_CHECK_CMD        = getattr( settings, "NAGIOS_LV_PERF_CHECK_CMD",      "check_diskstats" )

LV_SNAP_DESCRIPTION      = getattr( settings, "NAGIOS_LV_SNAP_DESCRIPTION",    "Snapshot Utilization of %s" )
LV_SNAP_CHECK_CMD        = getattr( settings, "NAGIOS_LV_SNAP_CHECK_CMD",      "check_lvm_snapshot" )

TWRAID_UNIT_DESCRIPTION  = getattr( settings, "NAGIOS_TWRAID_UNIT_DESCRIPTION","RAID Unit state %s" )
TWRAID_UNIT_CHECK_CMD    = getattr( settings, "NAGIOS_TWRAID_UNIT_CHECK_CMD",  "check_twraid_unit" )

TRAFFIC_DESCRIPTION      = getattr( settings, "NAGIOS_TRAFFIC_DESCRIPTION",    "Traffic on %s" )
TRAFFIC_CHECK_CMD        = getattr( settings, "NAGIOS_TRAFFIC_CHECK_CMD",      "check_protocol_traffic" )

CPUTIME_DESCRIPTION      = getattr( settings, "NAGIOS_CPUTIME_DESCRIPTION",    "CPU Time" )
CPUTIME_CHECK_CMD        = getattr( settings, "NAGIOS_CPUTIME_CHECK_CMD",      "check_cputime" )

RRD_PATH                 = getattr( settings, "NAGIOS_RRD_PATH",          "/var/lib/pnp4nagios/perfdata/%(host)s/%(serv)s.rrd" )
XML_PATH                 = getattr( settings, "NAGIOS_RRD_PATH",          "/var/lib/pnp4nagios/perfdata/%(host)s/%(serv)s.xml" )
CMD_PATH                 = getattr( settings, "NAGIOS_CMD_PATH",          "/var/lib/nagios3/rw/nagios.cmd" )
STATUS_DAT_PATH          = getattr( settings, "NAGIOS_STATUS_DAT_PATH",   "/var/cache/nagios3/status.dat" )

NAGIOS_CFG_PATH          = getattr( settings, "NAGIOS_CFG_PATH",            "/etc/nagios3/nagios.cfg" )
CONTACTS_CFG_PATH        = getattr( settings, "NAGIOS_CONTACTS_CFG_PATH",   "/etc/nagios3/conf.d/openattic_contacts.cfg" )
SERVICES_CFG_PATH        = getattr( settings, "NAGIOS_SERVICES_CFG_PATH",   "/etc/nagios3/conf.d/openattic.cfg" )
INCLUDE_HOST_IN_CFG      = getattr( settings, "NAGIOS_INCLUDE_HOST_IN_CFG", True )

BINARY_NAME              = getattr( settings, "NAGIOS_BINARY_NAME",         "nagios3" )
SERVICE_NAME             = getattr( settings, "NAGIOS_SERVICE_NAME",        "nagios3" )
