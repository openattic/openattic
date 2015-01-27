# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

INITSCRIPT      = getattr( settings, "SAMBA_INITSCRIPT", "/etc/init.d/samba" )
SMB_CONF        = getattr( settings, "SAMBA_SMB_CONF",   "/etc/samba/smb.conf" )
DOMAIN          = getattr( settings, "SAMBA_DOMAIN",     "" )
WORKGROUP       = getattr( settings, "SAMBA_WORKGROUP",  "" )
