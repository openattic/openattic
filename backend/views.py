# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

import json

from django import template
from django.shortcuts  import render_to_response
from django.template   import RequestContext
from django.http       import HttpResponse, HttpResponseRedirect
from django.conf       import settings
from django.contrib.auth            import login, logout
from django.contrib.auth.decorators import login_required

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication

from userprefs.models import UserProfile
from ifconfig.models  import Host

from oa_auth import oa_authenticate, oa_authorize, Unauthorized, RequestAuthentication
from rest.restapi import UserSerializer

class AuthView(APIView):
    authentication_classes = (SessionAuthentication, RequestAuthentication)
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        if hasattr(request.user, "backend"):
            # If the user was already logged in when posting data to the login
            # view, the authentication code has not been run and login() will
            # fail. hence, we only call it if the `backend' attribute is present,
            # which is set by django's authenticate().
            login(request, request.user)
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def delete(self, request, *args, **kwargs):
        logout(request)
        return Response({})

def do_login( request ):
    """ Check login credentials sent by ExtJS. """

    user = oa_authenticate(request)

    if user is None:
        return HttpResponse( json.dumps({ "success": False, "errormsg": 'invalid_credentials' }), "application/json", status=401 )

    try:
        oa_authorize(user)
    except Unauthorized, err:
        return HttpResponse( json.dumps({ "success": False, "errormsg": err.args[0] }), "application/json", status=403 )

    # Good to go!
    login( request, user )
    return HttpResponse( json.dumps({ "success": True }), "application/json", status=200 )

