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

from systemd       import invoke, logged, LockingPlugin, method
from nfs.models    import Export
from nfs.conf      import settings as nfs_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/twraid"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( nfs_settings.EXPORTS, "wb" )
            try:
                for export in Export.objects.all():
                    fd.write( "%-50s %s(%s)\n" % ( export.path, export.address, export.options ) )
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="sb", out_signature="i")
    def set_identify(self, path, state):
        statestr = { False: "off", True: "on" }[state]
        return invoke(["tw-cli", path, "set", "identify=%s" % statestr])
