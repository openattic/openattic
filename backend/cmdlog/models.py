# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from django.db import models
from django.utils.translation import ugettext_lazy as _

from ifconfig.models import Host


class LogEntry(models.Model):
    """
    An entry in the log. Mostly deprecated now.

    >>> assert unicode(LogEntry(exitcode=1, command='cmd', starttime='s')) == "cmd at s (failed)"
    """
    host = models.ForeignKey(Host)
    command = models.CharField(max_length=250, verbose_name=_("Command"))
    user = models.CharField(max_length=50)
    starttime = models.DateTimeField(verbose_name=_("Start time"))
    endtime = models.DateTimeField(verbose_name=_("End time"))
    exitcode = models.IntegerField(verbose_name=_("Exit code"))
    text = models.TextField(verbose_name=_("Output"))

    def __unicode__(self):
        if self.exitcode == 0:
            templ = "%s at %s"
        else:
            templ = "%s at %s (failed)"
        return templ % (self.command, self.starttime)
