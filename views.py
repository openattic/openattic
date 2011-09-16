# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import render_to_response, get_object_or_404, get_list_or_404
from django.template   import RequestContext
from django.http       import HttpResponse, HttpResponseRedirect, Http404
from django.contrib.auth            import authenticate, login, logout
from django.views.decorators.csrf   import csrf_exempt
from django.contrib.auth.decorators import login_required

def do_login( request ):
    """ Check login credentials sent by ExtJS. """
    if "username" not in request.POST or "password" not in request.POST:
        # Request is invalid, but check if user is already authed, and if so: return success nevertheless
        if request.user.is_authenticated():
            return HttpResponse( "{ success: true }", "application/json" );
        return HttpResponse( "{ success: false, errormsg: 'invalid_request' }", "application/json" );

    username = request.POST['username'];
    password = request.POST['password'];

    user = authenticate( username=username, password=password );

    if user is not None:
        if user.is_active:
            login( request, user );
            return HttpResponse( "{ success: true }", "application/json" );
        else:
            return HttpResponse( "{ success: false, errormsg: 'disabled_account' }", "application/json" );
    else:
        return HttpResponse( "{ success: false, errormsg: 'invalid_credentials' }", "application/json" );

@login_required
def do_logout( request ):
    """ Log out the user. """
    logout( request );
    return HttpResponse( "{ success: true }", "application/json" );

def index(request):
    theme = request.session.get("theme", None)
    if not request.user.is_authenticated():
        return render_to_response('index_ext_unauthed.html', {
            'THEME': theme
            }, context_instance = RequestContext(request))
    else:
        return render_to_response('index_ext_authed.html', {
            'THEME': theme
            }, context_instance = RequestContext(request))

def settheme(request):
    theme = request.POST["theme"]
    if not theme:
        request.session["theme"] = None
    else:
        request.session["theme"] = theme
    return HttpResponse( "{ success: true }", "application/json" );
