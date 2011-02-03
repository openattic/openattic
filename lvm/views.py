# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext
from django.http       import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required

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
def lvadd(request):
    if request.method == "POST":
        lvform = LvForm(request.POST)
        if lvform.is_valid():
            lvform.save()
            return HttpResponseRedirect(reverse(lvlist))
    else:
        lvform = LvForm()

    return render_to_response( "lvm/lvadd.html", {
        "LvForm": lvform,
        }, context_instance = RequestContext(request) )



@login_required
def lvedit(request, lvid):
    lv = get_object_or_404( LogicalVolume, id=lvid )

    if request.method == "POST":
        lvform = LvEditForm(request.POST, instance=lv)
        if lvform.is_valid():
            lvform.save()
            return HttpResponseRedirect(reverse(lvlist))
    else:
        lvform = LvEditForm(instance=lv)

    return render_to_response( "lvm/lvedit.html", {
        "LV":     lv,
        "LvForm": lvform,
        }, context_instance = RequestContext(request) )


@login_required
def lvaddshare(request):
    lvid  = request.POST["lvid"]
    stype = request.POST["type"].lower()

    return HttpResponseRedirect(reverse( ("%s.views.add_share_for_lv" % stype), args=(lvid,) ))

@login_required
def lvdelete(request, lvid):
    lv = get_object_or_404( LogicalVolume, id=lvid )
    if lv.state == "active":
        for share in lv.get_shares():
            share.state = "delete"
            share.save()
        lv.state = "delete"
        lv.save()
    elif lv.state in ("new", "done"):
        for share in lv.get_shares():
            if share.state == "done":
                share.delete()
        lv.delete()
    return HttpResponseRedirect(reverse(lvlist))


