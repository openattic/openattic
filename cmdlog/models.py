# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models
from django.utils.translation   import ugettext_noop, ugettext_lazy as _

class LogEntry(models.Model):
    command   = models.CharField(max_length=250, verbose_name=_("Command"))
    starttime = models.DateTimeField(verbose_name=_("Start time"))
    endtime   = models.DateTimeField(verbose_name=_("End time"))
    exitcode  = models.IntegerField(verbose_name=_("Exit code"))
    text      = models.TextField(verbose_name=_("Output"))

    def __unicode__(self):
        if self.exitcode == 0:
            templ = "%s at %s"
        else:
            templ = "%s at %s (failed)"
        return templ % ( self.command, self.starttime )
