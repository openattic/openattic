# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext
from django.http       import HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required, permission_required

from plotutils         import piechart

from lvm.models        import VolumeGroup, LogicalVolume
from lvm.forms         import LvForm, LvEditForm


def lvlist(request):
    sharetypes = []
    for relobj in ( LogicalVolume._meta.get_all_related_objects() + LogicalVolume._meta.get_all_related_many_to_many_objects() ):
        try:
            sharetypes.append( relobj.model.share_type )
        except AttributeError:
            pass

    return render_to_response( "lvm/lvlist.html", {
        "Types":  sharetypes,
        "LVs":    LogicalVolume.objects.all().order_by("name")
        }, context_instance = RequestContext(request) )


def vglist(request):
    return render_to_response( "lvm/vglist.html", {
        "VGs":    VolumeGroup.objects.all().order_by("name")
        }, context_instance = RequestContext(request) )


@login_required
def lvaddshare(request):
    lvid  = request.POST["lvid"]
    stype = request.POST["type"].lower()

    return HttpResponseRedirect(reverse( ("%s_share_create" % stype), args=(lvid,) ))


def lvmemchart(request, lv):
    lv = get_object_or_404(LogicalVolume, id=lv)

    if not lv.filesystem:
        raise Http404("Given LV has no file system")

    lvstat = lv.fs.stat
    reserved = lvstat['size'] - lvstat['used'] - lvstat['free']

    return piechart([lvstat['used'], lvstat['free'], reserved],
        heading=lv.name, explode=[0, 0.05, 0],
        colors = ('#DB6D7C', '#B3DBA2', '#F9F9B8' ),
        titles = ('used', 'free', 'reserved'),
        )
