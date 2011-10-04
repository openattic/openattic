# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from cmdlog.models import LogEntry

class LogEntryHandler(ModelHandler):
    model = LogEntry

RPCD_HANDLERS = [LogEntryHandler]
