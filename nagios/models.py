# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.conf      import settings
from django.db        import models
from django.db.models import signals

from lvm.models import LogicalVolume

from nagios.conf import settings as nagios_settings
from nagios.readstatus import NagiosState

class Command(models.Model):
    name        = models.CharField(max_length=250, unique=True)

    def __unicode__(self):
        return self.name

class Service(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    description = models.CharField(max_length=250, unique=True)
    command     = models.ForeignKey(Command)
    arguments   = models.CharField(max_length=500)

    nagstate    = NagiosState()

    @classmethod
    def write_conf(cls):
        nag = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/nagios")
        nag.write_services()
        nag.restart()

    @property
    def state(self):
        for service in Service.nagstate["servicestatus"]:
            if service['service_description'] == self.description:
                return service
        raise SystemError("The status for this service could not be found in Nagios's status cache.")

def create_service_for_lv(**kwargs):
    if not kwargs["instance"].filesystem:
        return

    cmd = Command.objects.get(name=nagios_settings.LV_CHECK_CMD)

    if Service.objects.filter(command=cmd, volume=kwargs["instance"]).count():
        return

    for mp in kwargs["instance"].fs.mountpoints:
        serv = Service(
            volume      = kwargs["instance"],
            command     = cmd,
            description = nagios_settings.LV_DESCRIPTION % kwargs["instance"].name,
            arguments   = "%d!%d!%s" % (nagios_settings.LV_WARN_LEVEL, nagios_settings.LV_CRIT_LEVEL, mp)
            )
        serv.save()

    Service.write_conf()


def delete_service_for_lv(**kwargs):
    for serv in Service.objects.filter(volume=kwargs["instance"]):
        serv.delete()

    Service.write_conf()


signals.post_save.connect(  create_service_for_lv, sender=LogicalVolume )
signals.pre_delete.connect( delete_service_for_lv, sender=LogicalVolume )
