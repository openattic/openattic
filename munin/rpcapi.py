# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

from rpcd.handlers import ModelHandler

from munin.models import MuninNode

class MuninNodeHandler(ModelHandler):
    model = MuninNode

    def get_modules(self, obj):
        """ Return a list of modules loaded by the given Munin node. """
        mn = MuninNode.objects.get(id=obj)
        return mn.modules

    def get_module_url(self, obj, module, time):
        """ Return an image URL for the given node, module and time (day/week/month/year). """
        mn = MuninNode.objects.get(id=obj)
        return mn.get_module_url(module, time)

RPCD_HANDLERS = [MuninNodeHandler]
