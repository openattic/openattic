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

