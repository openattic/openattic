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

from django.conf import settings

IETD_CONF       = getattr( settings, "ISCSI_IETD_CONF",     "/etc/ietd.conf"          )
TARGETS_ALLOW   = getattr( settings, "ISCSI_TARGETS_ALLOW", "/etc/targets.allow"      )
INITR_ALLOW     = getattr( settings, "ISCSI_INITR_ALLOW",   "/etc/initiators.allow"   )
INITR_DENY      = getattr( settings, "ISCSI_INITR_DENY",    "/etc/initiators.deny"    )
INITSCRIPT      = getattr( settings, "ISCSI_INITSCRIPT",    "/etc/init.d/iscsitarget" )

