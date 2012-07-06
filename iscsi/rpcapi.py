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
from rpcd.handlers import ProxyModelHandler

from iscsi.models import Target, Lun, Initiator

class IscsiTargetHandler(ModelHandler):
    model = Target

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

class IscsiLunHandler(ModelHandler):
    model = Lun

class IscsiLunProxy(ProxyModelHandler):
    model = Lun


class IscsiInitiatorHandler(ModelHandler):
    model = Initiator

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

RPCD_HANDLERS = [IscsiTargetHandler, IscsiLunProxy, IscsiInitiatorHandler]
