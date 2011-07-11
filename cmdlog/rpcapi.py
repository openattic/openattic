# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from cmdlog.models import LogEntry

class LogEntryHandler(BaseHandler):
    model = LogEntry

RPCD_HANDLERS = [LogEntryHandler]
