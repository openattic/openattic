# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

from systemd       import logged, invoke, LockingPlugin, method
from pamauth       import PamBackend
from samba.models  import Share
from samba.conf    import settings as samba_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/samba"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
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
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def reload(self):
        return invoke([samba_settings.INITSCRIPT, "reload"])

    @method(in_signature="ss", out_signature="i")
    def setpasswd(self, username, passwd):
        #return invoke(["smbpasswd", "-a", "-e", "-s", username], log=False, stdin=("%s\n%s\n" % (passwd, passwd)))
        return invoke(["pdbedit", "-a", "-t", "-u", username], log=False, stdin=("%s\n%s\n" % (passwd, passwd)))

    setpasswd._enable_logging = False
