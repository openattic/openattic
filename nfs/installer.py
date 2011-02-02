# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils import invoke
from nfs.models    import Export
from nfs.conf      import settings as nfs_settings

def writeconf():
    fd = open( nfs_settings.EXPORTS, "w" )
    for export in Export.objects.filter(state__in=("new", "active")):
        fd.write( "%-50s %s(%s)\n" % ( export.path, export.address, export.options ) )
    fd.close()

    invoke(["exportfs", "-a"])


def postinst(options, args):
    if Export.objects.filter(state="new").count() > 0 or options.confupdate:
        writeconf()
        for export in Export.objects.filter(state="new"):
            export.state = "active"
            export.save()

def prerm(options, args):
    if Export.objects.filter(state="delete").count() > 0:
        writeconf()
        for export in Export.objects.filter(state="delete"):
            export.state = "done"
            export.save()
