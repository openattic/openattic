# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

IETD_CONF       = getattr( settings, "ISCSI_IETD_CONF",     "/etc/ietd.conf"          )
TARGETS_ALLOW   = getattr( settings, "ISCSI_TARGETS_ALLOW", "/etc/targets.allow"      )
TARGETS_DENY    = getattr( settings, "ISCSI_TARGETS_DENY",  "/etc/targets.deny"       )
INITR_ALLOW     = getattr( settings, "ISCSI_INITR_ALLOW",   "/etc/initiators.allow"   )
INITR_DENY      = getattr( settings, "ISCSI_INITR_DENY",    "/etc/initiators.deny"    )
INITSCRIPT      = getattr( settings, "ISCSI_INITSCRIPT",    "/etc/init.d/iscsitarget" )

