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

import logging

from django.conf import settings
from rest_framework.routers import DefaultRouter

def get_router():
    logging.info("Detecting modules...")
    rpcdplugins = []
    for app in settings.INSTALLED_APPS:
        try:
            module = __import__( app+".restapi" )
        except ImportError, err:
            if unicode(err) != "No module named restapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)
    logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in rpcdplugins]) )

    router = DefaultRouter(trailing_slash=False)

    for plugin in rpcdplugins:
        for args in getattr(getattr(plugin, "restapi"), "RESTAPI_VIEWSETS", []):
            router.register(*args)

    return router

ROUTER = get_router()
