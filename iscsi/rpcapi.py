# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from iscsi.models import Target, Lun, Initiator

class IscsiTargetHandler(ModelHandler):
    model = Target

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

class IscsiLunHandler(ModelHandler):
    model = Lun

class IscsiInitiatorHandler(ModelHandler):
    model = Initiator

RPCD_HANDLERS = [IscsiTargetHandler, IscsiLunHandler, IscsiInitiatorHandler]
