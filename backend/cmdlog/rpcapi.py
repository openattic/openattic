# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

from datetime import datetime

from rpcd.handlers import ProxyModelHandler, ModelHandler

from cmdlog.models import LogEntry

class LogEntryHandler(ModelHandler):
    model = LogEntry

    def count_older_than(self, timestamp):
        """ Return the count of log entries that are older than `timestamp`. """
        return LogEntry.objects.filter( endtime__lt=datetime.fromtimestamp(timestamp) ).count()

    def remove_older_than(self, timestamp):
        """ Delete log entries that are older than `timestamp`. """
        return LogEntry.objects.filter( endtime__lt=datetime.fromtimestamp(timestamp) ).delete()

RPCD_HANDLERS = [LogEntryHandler]
