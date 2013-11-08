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

from django.db   import models

from systemd import get_dbus_object
from ifconfig.models import HostDependentManager
from volumes.models import FileSystemVolume

class ExportManager(HostDependentManager):
    hostfilter  = "volume__pool__volumepool__host"

    def get_query_set(self):
        return models.Manager.get_query_set(self)


class Export(models.Model):
    volume      = models.ForeignKey(FileSystemVolume)
    path        = models.CharField(max_length=255)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")

    objects     = ExportManager()
    all_objects = models.Manager()
    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        nfs = get_dbus_object("/nfs")
        nfs.writeconf()
        nfs.exportfs(True, self.path, self.address, self.options)
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        nfs = get_dbus_object("/nfs")
        nfs.writeconf()
        nfs.exportfs(False, self.path, self.address, self.options)
        return ret
