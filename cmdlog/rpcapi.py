# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from datetime import datetime

from rpcd.handlers import ModelHandler

from cmdlog.models import LogEntry

class LogEntryHandler(ModelHandler):
    model = LogEntry

    def count_older_than(self, timestamp):
        return LogEntry.objects.filter( endtime__lt=datetime.fromtimestamp(timestamp) ).count()

    def remove_older_than(self, timestamp):
        return LogEntry.objects.filter( endtime__lt=datetime.fromtimestamp(timestamp) ).delete()

RPCD_HANDLERS = [LogEntryHandler]
