# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service

from django.conf import settings

from lvm.procutils import invoke
from lvm.systemd   import logged

from iscsi.models import Target, Lun
from iscsi.conf   import settings as iscsi_settings

@logged
class SystemD(dbus.service.Object):
    dbus_path = "/iscsi"

    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def writeconf(self):
        ietd = open( iscsi_settings.IETD_CONF,   "w" )
        allw = open( iscsi_settings.INITR_ALLOW, "w" )
        deny = open( iscsi_settings.INITR_DENY,  "w" )

        for target in Target.objects.all():
            ietd.write( "Target %s\n" % target.iscsiname )

            for lun in target.lun_set.filter(state__in=("new", "update", "active")):
                ietd.write( "\tLun %d Path=%s,Type=%s\n" % (lun.number, lun.volume.path, lun.ltype) )
                if lun.alias:
                    ietd.write( "\tAlias %s\n" % lun.alias )

            if target.init_allow.all().count() == target.init_deny.all().count() == 0:
                if target.allowall:
                    allw.write( "%s ALL\n" % target.iscsiname )
                else:
                    deny.write( "%s ALL\n" % target.iscsiname )
            else:
                if target.init_allow.all().count():
                    allw.write( "%s %s\n" % ( target.iscsiname,
                        ', '.join([rec["address"] for rec in target.init_allow.values("address")])
                        ))
                if target.init_deny.all().count():
                    deny.write( "%s %s\n" % ( target.iscsiname,
                        ', '.join([rec["address"] for rec in target.init_deny.values("address")])
                        ))

        ietd.close()
        allw.close()
        deny.close()
        return invoke([iscsi_settings.INITSCRIPT, "restart"])
