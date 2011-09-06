# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.db   import models
from django.conf import settings

from lvm.models import StatefulModel, LogicalVolume

class Export(StatefulModel):
    volume      = models.ForeignKey(LogicalVolume)
    path        = models.CharField(max_length=255)
    address     = models.CharField(max_length=250)
    options     = models.CharField(max_length=250, default="rw,no_subtree_check,no_root_squash")

    share_type  = "nfs"

    def __unicode__(self):
        return "%s - %s" % ( self.volume, self.address )

    def save( self, *args, **kwargs ):
        self.state = "active"
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)
        nfs = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nfs")
        nfs.writeconf()
        if not self.volume.standby:
            nfs.exportfs()
        return ret

    def delete( self ):
        self.state = "done"
        ret = StatefulModel.delete(self)
        nfs = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nfs")
        nfs.writeconf()
        if not self.volume.standby:
            nfs.exportfs()
        return ret
