# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
import socket

from django.db import models
from django.conf import settings

from systemd.helpers import dbus_to_python

class InitScript(models.Model):
    name        = models.CharField(max_length=50)

    def run_initscript(self, command):
        return dbus_to_python(
            dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").run_initscript(self.name, command)
            )

    def start(self):
        return self.run_initscript("start")

    def stop(self):
        return self.run_initscript("stop")

    @property
    def status(self):
        return self.run_initscript("status")

    @property
    def running(self):
        return self.state == 0

    @property
    def stopped(self):
        return self.state == 3

class NTP(models.Model):
    server = models.CharField(max_length=50)
    
    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        ntp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        ntp.write_ntp()
        return ret
  
    def delete( self ):
        ret = models.Model.delete(self)
        ntp = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils")
        ntp.write_ntp()
        return ret
