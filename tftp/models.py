# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings

from ifconfig.models import IPAddress
from lvm.models import LogicalVolume

class Instance(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    path        = models.CharField(max_length=255)
    address     = models.ForeignKey(IPAddress, unique=True)

    share_type  = "tftp"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        tftp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/tftp")
        tftp.writeconf()
        tftp.reload()
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        tftp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/tftp")
        tftp.writeconf()
        tftp.reload()
        return ret
