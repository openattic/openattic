# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from systemd       import invoke, logged, LockingPlugin, method
from nfs.models    import Export
from nfs.conf      import settings as nfs_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/nfs"

    @method(in_signature="", out_signature="i")
    def writeconf(self):
        self.lock.acquire()
        try:
            fd = open( nfs_settings.EXPORTS, "wb" )
            try:
                for export in Export.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update"):
                    fd.write( "%-50s %s(%s)\n" % ( export.path, export.address, export.options ) )
            finally:
                fd.close()

            return invoke(["/usr/sbin/exportfs", "-a"])
        finally:
            self.lock.release()

