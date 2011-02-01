# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext

from lvm.models        import LogicalVolume

def lvlist(request):
    return render_to_response( "lvm/lvlist.html", {
        "LVs": LogicalVolume.objects.all()
        }, context_instance = RequestContext(request) )
