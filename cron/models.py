# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import dbus

from django.db   import models
from django.conf import settings

from ifconfig.models import getHostDependentManagerClass

class Cronjob(models.Model):
    volume      = models.ForeignKey("lvm.LogicalVolume")
    minute      = models.CharField(max_length=50)
    hour        = models.CharField(max_length=50)
    domonth     = models.CharField(max_length=50)
    month       = models.CharField(max_length=50)
    doweek      = models.CharField(max_length=50)
    command     = models.CharField(max_length=500)

    objects     = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        models.Model.save(self, *args, **kwargs)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/cron").writeconf()

    def delete( self ):
        ret = models.Model.delete(self)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/cron").writeconf()
        return ret
