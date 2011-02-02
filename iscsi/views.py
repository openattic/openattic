# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext

from iscsi.models import Lun
from iscsi.forms  import LunForm

def lunedit(request, lid):
    lun = get_object_or_404( Lun, id=lid )

    if request.method == "POST":
        lunform = LunForm(request.POST, instance=lun)
        if lunform.is_valid():
            lunform.save()
    else:
        lunform = LunForm(instance=lun)

    return render_to_response( "iscsi/lunedit.html", {
        "Lun":     lun,
        "LunForm": lunform,
        }, context_instance = RequestContext(request) )


def lundelete(request, lid):
    pass

def add_share_for_lv(request, lvid):
    return render_to_response( "iscsi/addshare.html" )
