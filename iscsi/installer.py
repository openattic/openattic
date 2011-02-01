# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils import invoke
from iscsi.models import Target, Lun
from iscsi.conf   import settings as iscsi_settings

def postinst(options, args):
    if Lun.objects.filter(state="new").count() > 0 or options.confupdate:
        fd = open( iscsi_settings.IETD_CONF, "w" )

        for target in Target.objects.all():
            fd.write( "Target %s\n" % target.name )

            for lun in target.lun_set.all():
                fd.write( "\tLun %d Path=%s,Type=%s\n" % (lun.number, lun.volume.path, lun.ltype) )
                if lun.alias:
                    fd.write( "\tAlias %s\n" % lun.alias )

        fd.close()
        invoke([iscsi_settings.INITSCRIPT, "restart"])

        for lun in Lun.objects.filter(state="new"):
            lun.state = "active"
            lun.save()
