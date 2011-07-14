# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from http.models import Export

class HttpExportHandler(BaseHandler):
    model = Export

RPCD_HANDLERS = [HttpExportHandler]
