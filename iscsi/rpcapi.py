# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from iscsi.models import Target, Lun

class IscsiTargetHandler(BaseHandler):
    model = Target

class IscsiLunHandler(BaseHandler):
    model = Lun

RPCD_HANDLERS = [IscsiTargetHandler, IscsiLunHandler]
