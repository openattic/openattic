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

    @deferredmethod(in_signature="bi")
    def writeconf(self, delete, id, sender):
        """
        Writes all known exports of Export.objects.all() into /etc/exports. The deletion of exports
        is handled by this method as well because it just refreshes the whole /etc/exports file.

        The parameters 'delete' and 'id' are needed if the method is called by a post_delete signal
        (see Jira issue OP-736 for more information).
        The Export object still exists during this signal but isn't allowed to be added to
        /etc/exports again.
        Handling this situation by one Parameter only is not possible because the DBUS protocol
        doesn't accept optional parameters or None.

        :param delete (bool): Does the current call delete an export? In the case of a delete-
            call there might be an object that should be skipped.
        :param id (int): Delete-calls: ID of the object that should be skipped and not be added to
            /etc/exports again.
            Save-calls: Any other Integer value (because the DBUS protocol doesn't accept optional
            parameters or None) - you could choose for example 0.
        :param sender: Unique ID of DBUS sender object

        :return: None
        """
        fd = open( nfs_settings.EXPORTS, "wb" )
        try:
            for export in Export.objects.all():
                if delete and id == export.id:
                    continue

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
