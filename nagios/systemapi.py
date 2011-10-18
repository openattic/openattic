# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.template.loader import render_to_string

from systemd       import invoke, logged, LockingPlugin, method
from nagios.models import Command, Service

@logged
class SystemD(LockingPlugin):
    dbus_path = "/nagios"

    @method(in_signature="", out_signature="")
    def write_services(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/nagios3/conf.d/openattic.cfg", "wb" )
            try:
                fd.write( render_to_string( "nagios/services.cfg", {
                    "Commands": Command.objects.all(),
                    "Services": Service.objects.all(),
                    } ) )
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def restart(self):
        return invoke(["/etc/init.d/nagios3", "restart"])

    @method(in_signature="", out_signature="i")
    def check_conf(self):
        return invoke(["nagios3", "--verify-config", "/etc/nagios3/nagios.cfg"])
