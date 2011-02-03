# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext
from django.http       import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required

from lvm.models   import LogicalVolume

from samba.models import Share
from samba.forms  import ShareForm

@login_required
def add_share_for_lv(request, lvid):
    lv = get_object_or_404( LogicalVolume, id=lvid )

    if request.method == "POST":
        shareform = ShareForm(request.POST)
        if shareform.is_valid():
            shareform.save()
            return HttpResponseRedirect(reverse('lvm.views.lvlist'))
    else:
        shareform = ShareForm()
        shareform.fields['volume'].initial = lv

    return render_to_response( "samba/addshare.html", {
        "LV":        lv,
        "ShareForm": shareform,
        }, context_instance = RequestContext(request) )
