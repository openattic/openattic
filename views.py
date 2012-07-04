# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

from django import template
from django.shortcuts  import render_to_response
from django.template   import RequestContext
from django.http       import HttpResponse
from django.conf       import settings
from django.contrib.auth            import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from userprefs.models import UserProfile
from ifconfig.models  import Host

def do_login( request ):
    """ Check login credentials sent by ExtJS. """
    if "username" not in request.POST or "password" not in request.POST:
        # Request is invalid, but check if user is already authed, and if so: return success nevertheless
        if request.user.is_authenticated():
            return HttpResponse( "{ success: true }", "application/json" )
        return HttpResponse( "{ success: false, errormsg: 'invalid_request' }", "application/json" )

    username = request.POST['username']
    password = request.POST['password']

    user = authenticate( username=username, password=password )

    if user is not None:
        if user.is_active:
            login( request, user )
            return HttpResponse( "{ success: true }", "application/json" )
        else:
            return HttpResponse( "{ success: false, errormsg: 'disabled_account' }", "application/json" )
    else:
        return HttpResponse( "{ success: false, errormsg: 'invalid_credentials' }", "application/json" )

@login_required
def do_logout( request ):
    """ Log out the user. """
    logout( request )
    return HttpResponse( "{ success: true }", "application/json" )

def index(request):
    request.META["CSRF_COOKIE_USED"] = True
    if not request.user.is_authenticated():
        return render_to_response('index_ext_unauthed.html', {
            }, context_instance = RequestContext(request))
    else:
        try:
            profile = request.user.get_profile()
        except UserProfile.DoesNotExist:
            profile = UserProfile(user=request.user, host=Host.objects.get_current())
            profile.save()

        if "theme" in profile:
            theme = profile["theme"]
        else:
            theme = None

        found_templates = []
        for app in settings.INSTALLED_APPS:
            try:
                tpl = "%s/mainhead.html" % app
                template.loader.get_template( tpl )
            except template.TemplateDoesNotExist:
                pass
            else:
                found_templates.append(tpl)

        return render_to_response('index_ext_authed.html', {
            'THEME': theme,
            'INSTALLED_APPS': settings.INSTALLED_APPS,
            'INSTALLED_APP_TEMPLATES': found_templates
            }, context_instance = RequestContext(request))
