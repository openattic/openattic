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
from django.conf import settings
from django.db import models


class SSMTP(models.Model):
    root            = models.CharField(max_length=250)
    mailhub         = models.CharField(max_length=250)
    rewriteDomain   = models.CharField(max_length=250)

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        ssmtp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ssmtp")
        ssmtp.writeconf()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        ssmtp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ssmtp")
        ssmtp.writeconf()
        return ret

