# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from clustering.models import ServiceIP4

class ServiceIP4Handler(ModelHandler):
    model = ServiceIP4

RPCD_HANDLERS = [ServiceIP4Handler]
