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
from __future__ import absolute_import
import logging

from utilities import get_django_app_modules

logger = logging.getLogger(__name__)


def load_viewsets(module_param):

    viewsets = []

    for plugin in get_django_app_modules('restapi'):
        viewsets.extend(getattr(plugin, module_param, []))

    return viewsets
