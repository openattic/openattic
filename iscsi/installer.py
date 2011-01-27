# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils import invoke
from iscsi.models import Target, Lun
from iscsi.views  import conf


def postinst(options, args):
    if Lun.objects.filter(state="new").count() > 0 or options.confupdate:
        fd = open( "/etc/ietd.conf", "w" )
        fd.write( conf() )
        fd.close()
        invoke(["/etc/init.d/iscsitarget", "restart"])

        for lun in Lun.objects.filter(state="new"):
            lun.state = "active"
            lun.save()
