# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.conf import settings
from django.db   import models

from lvm.models import StatefulModel, LogicalVolume

class Export(StatefulModel):
    volume      = models.ForeignKey(LogicalVolume, related_name="http_export_set")

    share_type  = "http"

    def __unicode__(self):
        return unicode( self.volume )

    @property
    def path(self):
        return self.volume.fs.mountpoint

    def save( self, *args, **kwargs ):
        self.state = "active"
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/http").writeconf()
        return ret

    def delete( self ):
        self.state = "done"
        ret = StatefulModel.delete(self)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/http").writeconf()
        return ret
