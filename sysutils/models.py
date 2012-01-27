# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

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
        try:
            return self.run_initscript("status")
        except dbus.DBusException: 
            return None

    @property
    def running(self):
        return self.status == 0

    @property
    def stopped(self):
        return self.status == 3


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


import new
import hashlib
from django.db.models import signals
from django.contrib.auth import models as auth_models
from django.utils.encoding import smart_str
# http://djangosnippets.org/snippets/389/

def replace_set_password(instance=None, **kwargs):
    """ Replace the standard *_password functions in the auth model. """

    oldcheck = instance.check_password

    def set_password_crypt(self, raw_password):
        """ Set the password as unsalted SHA1 so it can be checked using pam_*sql. """
        self.password = str(hashlib.sha1(smart_str(raw_password)).hexdigest())

    def check_password_crypt(self, raw_password):
        """ See if the current password was stored in Django format, and if not,
            auth using the PAM compatible SHA1 hash.
        """
        if '$' in self.password:
            return oldcheck(raw_password)
        return str(hashlib.sha1( smart_str(raw_password) ).hexdigest()) == self.password

    instance.set_password = new.instancemethod(
        set_password_crypt, instance, instance.__class__)
    instance.check_password = new.instancemethod(
        check_password_crypt, instance, instance.__class__)

signals.post_init.connect(replace_set_password, sender=auth_models.User)
