# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings

from lvm.models import LogicalVolume

class Cronjob(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    minute      = models.CharField(max_length=50)
    hour        = models.CharField(max_length=50)
    dom         = models.CharField(max_length=50)
    mon         = models.CharField(max_length=50)
    dow         = models.CharField(max_length=50)
    command     = models.CharField(max_length=500)

    def save(self, *args, **kwargs):
        models.Model.save(self, *args, **kwargs)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/cron").writeconf()
