# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus

from django.conf      import settings
from django.db        import models
from django.db.models import signals
from django.utils.translation   import ugettext_noop, ugettext_lazy as _

from lvm.models import LogicalVolume

from nagios.conf import settings as nagios_settings
from nagios.readstatus import NagiosState

class Command(models.Model):
    name        = models.CharField(max_length=250, unique=True)

    def __unicode__(self):
        return self.name

class Graph(models.Model):
    command     = models.ForeignKey(Command)
    title       = models.CharField(max_length=250, unique=True)
    verttitle   = models.CharField(max_length=250, blank=True)
    fields      = models.CharField(max_length=250)

class Service(models.Model):
    volume      = models.ForeignKey(LogicalVolume, blank=True, null=True)
    description = models.CharField(max_length=250, unique=True)
    command     = models.ForeignKey(Command)
    arguments   = models.CharField(max_length=500, blank=True)
    query_only  = models.BooleanField(default=False, help_text=_("Check this if openATTIC should not configure this service, only query it."))

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
        raise KeyError("The status for this service could not be found in Nagios's status cache.")

    @property
    def perfdata(self):
        """ Get current performance data. """
        return [ pv.split('=', 1) for pv in self.state["performance_data"].split() ]


def create_service_for_lv(**kwargs):
    lv = kwargs["instance"]
    if not lv.filesystem:
        return

    cmd = Command.objects.get(name=nagios_settings.LV_UTIL_CHECK_CMD)
    if lv.filesystem and Service.objects.filter(command=cmd, volume=lv).count() == 0:
        for mp in lv.fs.mountpoints:
            serv = Service(
                volume      = lv,
                command     = cmd,
                description = nagios_settings.LV_UTIL_DESCRIPTION % lv.name,
                arguments   = "%d!%d!%s" % (nagios_settings.LV_UTIL_WARN_LEVEL, nagios_settings.LV_UTIL_CRIT_LEVEL, mp)
                )
            serv.save()

    cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
    if Service.objects.filter(command=cmd, volume=lv).count() == 0:
        serv = Service(
            volume      = lv,
            command     = cmd,
            description = nagios_settings.LV_PERF_DESCRIPTION % lv.name,
            arguments   = "dm-%s" % lv.lvm_info["LVM2_LV_KERNEL_MINOR"]
            )
        serv.save()

    Service.write_conf()


def delete_service_for_lv(**kwargs):
    lv = kwargs["instance"]
    for serv in Service.objects.filter(volume=lv):
        serv.delete()

    Service.write_conf()

signals.post_save.connect(  create_service_for_lv, sender=LogicalVolume )
signals.pre_delete.connect( delete_service_for_lv, sender=LogicalVolume )
