# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.db.models import Q
from django.template.loader import render_to_string

from lvm.procutils import invoke
from drbd.models   import DrbdDevice
#from drbd.conf     import settings as nfs_settings

def writeconf():
    for dev in DrbdDevice.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update"):
        fd = open("/etc/drbd.d/%s_%s_%d.res" % (dev.volume.vg.name, dev.volume.name, dev.id), "w")
        fd.write( render_to_string( "drbd/device.res", {
            'Hostname':  socket.gethostname(),
            'Device':    dev
            } ) )
        fd.close()


def preinst(options, args):
    if DrbdDevice.objects.filter(state="active", volume__state="update").count() > 0:
        writeconf()


def postinst(options, args):
    if DrbdDevice.objects.filter( Q( Q(state__in=("new", "update")) | Q(volume__state="pending") ) ).count() > 0 or \
       options.confupdate:
        writeconf()
        #DrbdDevice.objects.filter(state__in=("new", "update")).update(state="active")


def prerm(options, args):
    if DrbdDevice.objects.filter(state="delete").count() > 0:
        writeconf()
        #DrbdDevice.objects.filter(state="delete").update(state="done")
