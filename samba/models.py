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

from django.db import models

from systemd.helpers import get_dbus_object, Transaction
from ifconfig.models import getHostDependentManagerClass
from volumes.models import FileSystemVolume

class Share(models.Model):
    volume        = models.ForeignKey(FileSystemVolume)
    name          = models.CharField(max_length=50, unique=True)
    path          = models.CharField(max_length=255)
    available     = models.BooleanField(default=True,  blank=True)
    browseable    = models.BooleanField(default=True,  blank=True)
    guest_ok      = models.BooleanField(default=False, blank=True)
    writeable     = models.BooleanField(default=True,  blank=True)
    comment       = models.CharField(max_length=250, blank=True)

    share_type    = "samba"
    objects       = getHostDependentManagerClass("volume__storageobj__host")()
    all_objects   = models.Manager()

    def __unicode__(self):
        return unicode(self.volume)

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        with Transaction():
            samba = get_dbus_object("/samba")
            samba.writeconf("", "")
            samba.reload()
        return ret

    def delete( self ):
        volume = self.volume
        ret = models.Model.delete(self)
        with Transaction():
            samba = get_dbus_object("/samba")
            samba.writeconf("", "")
            samba.reload()
        return ret
