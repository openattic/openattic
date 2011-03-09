# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

APACHE2_CONF = getattr( settings, "HTTP_APACHE2_CONF", "/etc/apache2/sites-available/volumes" )
