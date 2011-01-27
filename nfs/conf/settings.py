# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

EXPORTS     = getattr( settings, "NFS_EXPORTS",   "/etc/exports" )
