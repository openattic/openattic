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

from django.db   import models

from systemd import get_dbus_object
from ifconfig.models import Host, HostDependentManager

class Cronjob(models.Model):
    host        = models.ForeignKey(Host)
    user        = models.CharField(max_length=50)
    minute      = models.CharField(max_length=50)
    hour        = models.CharField(max_length=50)
    domonth     = models.CharField(max_length=50)
    month       = models.CharField(max_length=50)
    doweek      = models.CharField(max_length=50)
    command     = models.CharField(max_length=500)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        models.Model.save(self, *args, **kwargs)
        get_dbus_object("/cron").writeconf()

    def delete( self ):
        ret = models.Model.delete(self)
        get_dbus_object("/cron").writeconf()
        return ret
