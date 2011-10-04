# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from nfs.models import Export

class NfsExportHandler(ModelHandler):
    model = Export

RPCD_HANDLERS = [NfsExportHandler]
