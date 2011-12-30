# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from tftp.models import Instance

class TftpInstanceHandler(ModelHandler):
    model = Instance

RPCD_HANDLERS = [TftpInstanceHandler]
