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
from systemd       import invoke, logged, LockingPlugin, method
from ssmtp.models  import SSMTP

@logged
class SystemD(LockingPlugin):
    dbus_path = "/ssmtp"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/ssmtp/ssmtp.conf", "wb" )
            try:
                    ssmtp = SSMTP.objects.all()[0]
                    fd.write( "root=%s\n" % ssmtp.root )
                    fd.write( "mailhub=%s\n" % ssmtp.mailhub )
                    fd.write( "rewriteDomain=%s\n" % ssmtp.rewriteDomain )
                    fd.write( "hostname=%s\n" % socket.getfqdn() )
                    fd.write( "FromLineOverride=NO\n" )
            finally:
                fd.close()
        finally:
            self.lock.release()

