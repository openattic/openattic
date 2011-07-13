# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus.service

from django.conf import settings
from django.template.loader import render_to_string

from systemd       import invoke, logged
from http.models   import Export
from http.conf     import settings as http_settings

@logged
class SystemD(dbus.service.Object):
    dbus_path = "/http"

    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def writeconf(self):
        fd = open(http_settings.APACHE2_CONF, "w")
        try:
            fd.write( render_to_string( "http/apache2.conf", {
                'Exports': Export.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update")
                } ) )
        finally:
            fd.close()
        return invoke([http_settings.APACHE2_INITSCRIPT, "reload"])
