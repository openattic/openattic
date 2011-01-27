# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

MOUNT_PREFIX     = getattr( settings, "LVM_MOUNT_PREFIX",   "/media" )
