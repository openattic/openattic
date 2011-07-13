# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.template.loader import render_to_string

from systemd       import invoke, logged, LockingPlugin, method
from http.models   import Export
from http.conf     import settings as http_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/http"

    @method(in_signature="", out_signature="i")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open(http_settings.APACHE2_CONF, "w")
            try:
                fd.write( render_to_string( "http/apache2.conf", {
                    'Exports': Export.objects.filter(state__in=("new", "update", "active"))\
                                .exclude(volume__state="update")
                    } ) )
            finally:
                fd.close()
            return invoke([http_settings.APACHE2_INITSCRIPT, "reload"])
        finally:
            self.lock.release()
