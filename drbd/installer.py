# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.db.models import Q
from django.template.loader import render_to_string

from lvm.procutils import invoke
from drbd.models   import DrbdDevice
#from drbd.conf     import settings as nfs_settings

def writeconf(dev):
    fd = open("/etc/drbd.d/%s_%s_%d.res" % (dev.volume.vg.name, dev.volume.name, dev.id), "w")
    fd.write( render_to_string( "drbd/device.res", {
        'Hostname':  socket.gethostname(),
        'Device':    dev
        } ) )
    fd.close()


def install_resource(dev):
    dev.set_pending()
    writeconf(dev)

    invoke(["drbdadm", "create-md", dev.res])
    invoke(["drbdadm", "attach",    dev.res])
    invoke(["drbdadm", "connect",   dev.res])

    if dev.init_master:
        invoke(["drbdsetup", dev.path, "primary", "--overwrite-data-of-peer"])

    dev.set_active()


def postinst(options, args):
    for dev in DrbdDevice.objects.filter(state="update"):
        dev.set_pending()
        writeconf(dev)
        invoke(["drbdadm", "adjust", dev.res])
        dev.set_active()

