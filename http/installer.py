# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db.models import Q
from django.template.loader import render_to_string

from lvm.procutils import invoke
from http.models   import Export
from http.conf     import settings as http_settings

def writeconf():
    fd = open(http_settings.APACHE2_CONF, "w")
    fd.write( render_to_string( "http/apache2.conf", {
        'Exports': Export.objects.filter(state__in=("new", "update", "active")).exclude(volume__state="update")
        } ) )
    fd.close()
    invoke(["/etc/init.d/apache2", "reload"])


def preinst(options, args):
    if Export.objects.filter(state="active", volume__state="update").count() > 0:
        writeconf()


def postinst(options, args):
    if Export.objects.filter( Q( Q(state__in=("new", "update")) | Q(volume__state="pending") ) ).count() > 0 or \
       options.confupdate:
        writeconf()
        Export.objects.filter(state__in=("new", "update")).update(state="active")


def prerm(options, args):
    if Export.objects.filter(state="delete").count() > 0:
        writeconf()
        Export.objects.filter(state="delete").update(state="done")
