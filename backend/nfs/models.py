# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

from django.db   import models

from systemd.helpers import get_dbus_object, Transaction
from ifconfig.models import getHostDependentManagerClass
from volumes.models import FileSystemVolume

class Export(models.Model):
    volume      = models.ForeignKey(FileSystemVolume)
    path        = models.CharField(max_length=255)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")

    objects     = getHostDependentManagerClass("volume__storageobj__host")()
    all_objects = models.Manager()
    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        with Transaction():
            self.volume.storageobj.lock()
            nfs = get_dbus_object("/nfs")
            nfs.writeconf(False, 0)
            nfs.exportfs(True, self.path, self.address, self.options)
        return ret

def __export_post_delete(instance, **kwargs):
    with Transaction():
        nfs = get_dbus_object("/nfs")
        nfs.writeconf(True, instance.id)
        nfs.exportfs(False, instance.path, instance.address, instance.options)

models.signals.post_delete.connect(__export_post_delete, sender=Export)

