# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from http.models import Export

class HttpExportHandler(ModelHandler):
    model = Export

RPCD_HANDLERS = [HttpExportHandler]
