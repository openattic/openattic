# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.db.models import Q
from django.template.loader import render_to_string

from lvm.procutils import invoke
from samba.models  import Share
from samba.conf    import settings as samba_settings

def writeconf():
    fd = open( samba_settings.SMB_CONF, "w" )
    fd.write( render_to_string( "samba/smb.conf", {
        'Hostname':  socket.gethostname(),
        'Domain':    samba_settings.DOMAIN,
        'Workgroup': samba_settings.WORKGROUP,
        'Shares':    Share.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update")
        } ) )
    fd.close()

    invoke([samba_settings.INITSCRIPT, "restart"])


def preinst(options, args):
    if Share.objects.filter(state__in=("active", "update"), volume__state="update").count() > 0:
        writeconf()

def postinst(options, args):
    if Share.objects.filter( Q( Q(state__in=("new", "update")) | Q(volume__state="pending") ) ).count() > 0 or \
       options.confupdate:
        writeconf()
        Share.objects.filter(state__in=("new", "update")).update(state="active")

def prerm(options, args):
    if Share.objects.filter(state="delete").count() > 0:
        writeconf()
        Share.objects.filter(state="delete").update(state="done")
