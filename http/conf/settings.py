# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf import settings

APACHE2_CONF       = getattr( settings, "HTTP_APACHE2_CONF",        "/etc/apache2/sites-available/volumes" )
APACHE2_BASEDIR    = getattr( settings, "HTTP_APACHE2_BASEDIR",     "/var/www/volumes"    )
APACHE2_INITSCRIPT = getattr( settings, "HTTP_APACHE2_INITSCRIPT",  "/etc/init.d/apache2" )
