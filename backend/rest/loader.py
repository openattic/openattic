# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
from django.utils.importlib import import_module

def load_viewsets(module_param):
    logging.info("Detecting modules...")
    rpcdplugins = []
    for app in settings.INSTALLED_APPS:
        try:
            module = import_module( app+".restapi" )
        except ImportError, err:
            if unicode(err) != "No module named restapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)
    logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in rpcdplugins]) )

    viewsets = []

    for plugin in rpcdplugins:
        viewsets.extend(getattr(plugin, module_param, []))

    return viewsets
