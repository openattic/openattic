# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from os.path import join

from django.conf import settings

VOLUMESDIR = getattr( settings, "HTTP_VOLUMESDIR", join(settings.PROJECT_ROOT, "http", "volumes") )
