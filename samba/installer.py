# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.template.loader import render_to_string

from lvm.procutils import invoke
from samba.models  import Share
from samba.conf    import settings as samba_settings

def writeconf():
    fd = open( samba_settings.SMB_CONF, "w" )
    fd.write( render_to_string( "samba/smb.conf", {
        'Shares': Share.objects.filter(state__in=("new", "active"))
        } ) )
    fd.close()

    invoke([samba_settings.INITSCRIPT, "restart"])


def postinst(options, args):
    if Share.objects.filter(state="new").count() > 0 or options.confupdate:
        writeconf()
        for share in Share.objects.filter(state="new"):
            share.state = "active"
            share.save()

def prerm(options, args):
    if Share.objects.filter(state="delete").count() > 0:
        writeconf()
        for share in Share.objects.filter(state="delete"):
            share.state = "done"
            share.save()
