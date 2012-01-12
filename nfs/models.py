# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings

from lvm.models import LogicalVolume

class Export(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    path        = models.CharField(max_length=255)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")

    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        nfs = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nfs")
        nfs.writeconf()
        if not self.volume.standby:
            nfs.exportfs()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        nfs = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nfs")
        nfs.writeconf()
        if not self.volume.standby:
            nfs.exportfs()
        return ret
