# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template                import RequestContext

from nfs.models import Export
from nfs.forms  import ExportForm

def exportedit(request, eid):
    export = get_object_or_404( Export, id=eid )

    if request.method == "POST":
        exportform = ExportForm(request.POST, instance=export)
        if exportform.is_valid():
            exportform.save()
    else:
        exportform = ExportForm(instance=export)

    return render_to_response( "nfs/exportedit.html", {
        "Export":     export,
        "ExportForm": exportform,
        }, context_instance = RequestContext(request) )

def exportdelete(request, eid):
    pass


def add_share_for_lv(request, lvid):
    return render_to_response( "nfs/addshare.html" )
