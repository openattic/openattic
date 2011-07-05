# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

class LogEntry(models.Model):
    command   = models.CharField(max_length=250)
    starttime = models.DateTimeField()
    endtime   = models.DateTimeField()
    exitcode  = models.IntegerField()
    text      = models.TextField()

    def __unicode__(self):
        if self.exitcode == 0:
            templ = "%s at %s"
        else:
            templ = "%s at %s (failed)"
        return templ % ( self.command, self.starttime )
