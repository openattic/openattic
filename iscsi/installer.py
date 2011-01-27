# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils import invoke
from iscsi.models import Target, Lun
from iscsi.views  import conf

from iscsi.conf   import settings as iscsi_settings

def postinst(options, args):
    if Lun.objects.filter(state="new").count() > 0 or options.confupdate:
        fd = open( iscsi_settings.IETD_CONF, "w" )
        fd.write( conf() )
        fd.close()
        invoke([iscsi_settings.INITSCRIPT, "restart"])

        for lun in Lun.objects.filter(state="new"):
            lun.state = "active"
            lun.save()
