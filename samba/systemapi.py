# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import socket

from django.template.loader import render_to_string

from systemd.procutils import service_command
from systemd.plugins   import logged, BasePlugin, method, deferredmethod
from samba.models  import Share
from samba.conf    import settings as samba_settings

@logged
class SystemD(BasePlugin):
    dbus_path = "/samba"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        fd = open( samba_settings.SMB_CONF, "wb" )
        try:
            fd.write( render_to_string( "samba/smb.conf", {
                'Hostname':  socket.gethostname(),
                'Domain':    samba_settings.DOMAIN,
                'Workgroup': samba_settings.WORKGROUP,
                'Shares':    Share.objects.all()
                } ).encode("UTF-8") )
        finally:
            fd.close()

    @deferredmethod(in_signature="")
    def reload(self, sender):
        return service_command(samba_settings.SERVICE_NAME, "reload")
