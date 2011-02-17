# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404
from django.template   import RequestContext
from django.http       import HttpResponseRedirect
from django.forms.models import ModelFormMetaclass, ModelForm

from lvm.models   import LogicalVolume

def add_share_for_lv(request, lvid, model, template_name, perm=None, form_class=None,
                     volume_field="volume", post_create_redirect='lvm.views.lvlist',
                     other_field_defaults=None ):
    """ Generic view that creates a form for a new share, and pre-populates
        the form's volume field with the previously selected LV.
    """

    if not request.user.is_authenticated():
        return redirect_to_login(request.path)

    if perm is not None and not request.user.has_perm(perm):
        return redirect_to_login(request.path)

    if form_class is None:
        # See django/views/generic/create_update.py, func get_model_and_form_class.
        class_name = model.__name__ + 'Form'
        form_class = ModelFormMetaclass(class_name, (ModelForm,), {'Meta':
            type( 'Meta', (object,), {'model': model} )
            })

    lv = get_object_or_404( LogicalVolume, id=lvid )

    if request.method == "POST":
        form = form_class(request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(post_create_redirect)
    else:
        form = form_class()
        form.fields[volume_field].initial = lv
        if other_field_defaults is not None:
            for fieldname in other_field_defaults:
                form.fields[fieldname].initial = other_field_defaults[fieldname]

    return render_to_response( template_name, {
        "LV":   lv,
        "form": form,
        }, context_instance = RequestContext(request) )
