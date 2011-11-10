# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

MOUNT_PREFIX     = getattr( settings, "LVM_MOUNT_PREFIX",   "/media"       )
CHOWN_GROUP      = getattr( settings, "LVM_CHOWN_GROUP",    "domain users" )
LOG_COMMANDS     = getattr( settings, "LVM_LOG_COMMANDS",   False )
SYSD_INFO_TTL    = 5