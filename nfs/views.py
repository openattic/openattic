# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext
from django.http       import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required, permission_required

from lvm.models   import LogicalVolume

from nfs.models import Export
from nfs.forms  import ExportForm

@permission_required("nfs.add_export")
def add_share_for_lv(request, lvid):
    lv = get_object_or_404( LogicalVolume, id=lvid )

    if request.method == "POST":
        exportform = ExportForm(request.POST)
        if exportform.is_valid():
            exportform.save()
            return HttpResponseRedirect(reverse('lvm.views.lvlist'))
    else:
        exportform = ExportForm()
        exportform.fields['volume'].initial = lv

    return render_to_response( "nfs/addshare.html", {
        "LV":      lv,
        "ExportForm": exportform,
        }, context_instance = RequestContext(request) )
