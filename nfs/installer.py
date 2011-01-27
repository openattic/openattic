# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils import invoke
from nfs.models    import Export
from nfs.views     import conf

def postinst(options, args):
    if Export.objects.filter(state="new").count() > 0 or options.confupdate:

        fd = open( "/etc/exports", "w" )
        fd.write( conf() )
        fd.close()

        invoke(["exportfs", "-a"])

        for export in Export.objects.filter(state="new"):
            export.state = "active"
            export.save()
