# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, deferredmethod
from nfs.models    import Export
from nfs.conf      import settings as nfs_settings

@logged
class SystemD(BasePlugin):
    dbus_path = "/nfs"

    @deferredmethod(in_signature="")
    def writeconf(self, sender):
        fd = open( nfs_settings.EXPORTS, "wb" )
        try:
            for export in Export.objects.all():
                fd.write( "%-50s %s(%s)\n" % ( export.path, export.address, export.options ) )
        finally:
            fd.close()

    @deferredmethod(in_signature="bsss")
    def exportfs(self, export, path, host, options, sender):
        cmd = ["/usr/sbin/exportfs"]
        if not export:
            cmd.append("-u")
        if options:
            cmd.extend(["-o", options])
        cmd.append("%s:%s" % (host, path))
        invoke(cmd)
