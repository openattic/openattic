# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

INITSCRIPT      = getattr( settings, "SAMBA_INITSCRIPT", "/etc/init.d/smbd" )
SMB_CONF        = getattr( settings, "SAMBA_SMB_CONF",   "/etc/samba/smb.conf" )
DOMAIN          = getattr( settings, "SAMBA_DOMAIN",     "" )
WORKGROUP       = getattr( settings, "SAMBA_WORKGROUP",  "" )
