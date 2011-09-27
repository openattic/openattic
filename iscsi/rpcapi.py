# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from iscsi.models import Target, Lun, Initiator

class IscsiTargetHandler(BaseHandler):
    model = Target

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

class IscsiLunHandler(BaseHandler):
    model = Lun

class IscsiInitiatorHandler(BaseHandler):
    model = Initiator

RPCD_HANDLERS = [IscsiTargetHandler, IscsiLunHandler, IscsiInitiatorHandler]
