# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import logging
import json
import grp

from django import template
from django.shortcuts  import render_to_response
from django.template   import RequestContext
from django.http       import HttpResponse, HttpResponseRedirect
from django.conf       import settings
from django.contrib.auth            import authenticate, login, logout
from django.contrib.auth.models     import User
from django.contrib.auth.decorators import login_required

from rest_framework import exceptions
from rest_framework.views import APIView
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from restapi.restapi import UserSerializer

from userprefs.models import UserProfile
from ifconfig.models  import Host


class ExtendedBasicAuthentication(BasicAuthentication):
    def authenticate_credentials(self, userid, password):
        user = authenticate(username=userid, password=password)
        if user is None or not user.is_active:
            raise exceptions.AuthenticationFailed('Invalid username/password')

        if settings.AUTHZ_SYSGROUP and not user.is_staff:
            try:
                sysgroup = grp.getgrnam(settings.AUTHZ_SYSGROUP.encode("utf-8"))
            except KeyError, err:
                logging.error("Failed to query system group '%s': %s" % (settings.AUTHZ_SYSGROUP, unicode(err)))
            else:
                if user.username.lower() in [mem.lower() for mem in sysgroup.gr_mem]:
                    logging.warning("User '%s' is a member of system group '%s', granting staff privileges" % (
                                    user.username, settings.AUTHZ_SYSGROUP))
                    user.is_staff = True
                    user.save()
                else:
                    logging.warning("User '%s' is not a member of system group '%s' (Members: %s)" % (
                                    user.username, settings.AUTHZ_SYSGROUP, ', '.join(sysgroup.gr_mem)))

        if not user.is_staff:
            raise exceptions.PermissionDenied('The user needs to be staff.')

        return (user, None)


class AuthView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = (ExtendedBasicAuthentication,)

    def post(self, request, *args, **kwargs):
        login(request, request.user)
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def delete(self, request, *args, **kwargs):
        logout(request)
        return Response({})


def do_login( request ):
    """ Check login credentials sent by ExtJS. """

    # AUTHENTICATION

    user = None

    # If username + password given, check PAM and our database through authenticate().
    if "username" in request.POST and "password" in request.POST:
       username = request.POST['username']
       password = request.POST['password']
       user = authenticate( username=username, password=password )

    # Otherwise, take a look at the REMOTE_USER.
    elif "REMOTE_USER" in request.META:
        user = authenticate( remote_user=request.META["REMOTE_USER"] )

    else:
        # username + password may also be given as a JSON object.
        try:
            rawjson = json.loads(request.body)
            username = rawjson['username']
            password = rawjson['password']
            user = authenticate(username=username, password=password)
        except (ValueError, KeyError):
            return HttpResponse( json.dumps({ "success": False, "errormsg": 'invalid_request' }), "application/json", status=400 )

    if user is None:
        return HttpResponse( json.dumps({ "success": False, "errormsg": 'invalid_credentials' }), "application/json", status=401 )

    # OK, so now we have a user object and we know they are who they say they are.

    # AUTHORIZATION

    # We only allow active staff members to log in.
    if not user.is_active:
        return HttpResponse( json.dumps({ "success": False, "errormsg": 'disabled_account' }), "application/json", status=403 )

    # If we have a system user group configured and the user is not a staff member,
    # we may have to grant them staff privileges if they are a member of the
    # configured group.
    if settings.AUTHZ_SYSGROUP and not user.is_staff:
        try:
            sysgroup = grp.getgrnam(settings.AUTHZ_SYSGROUP.encode("utf-8"))
        except KeyError, err:
            logging.error("Failed to query system group '%s': %s" % (settings.AUTHZ_SYSGROUP, unicode(err)))
        else:
            if user.username.lower() in [mem.lower() for mem in sysgroup.gr_mem]:
                logging.warning("User '%s' is a member of system group '%s', granting staff privileges" % (
                                user.username, settings.AUTHZ_SYSGROUP))
                user.is_staff = True
                user.save()
            else:
                logging.warning("User '%s' is not a member of system group '%s' (Members: %s)" % (
                                user.username, settings.AUTHZ_SYSGROUP, ', '.join(sysgroup.gr_mem)))

    if not user.is_staff:
        return HttpResponse( json.dumps({ "success": False, "errormsg": 'unauthorized' }), "application/json", status=403 )

    # Good to go!
    login( request, user )
    return HttpResponse( json.dumps({ "success": True }), "application/json", status=200 )

@login_required
def do_logout( request ):
    """ Log out the user. """
    logout( request )
    if settings.ANGULAR_LOGIN:
        return HttpResponseRedirect("angular/login_oa.html")

    return HttpResponse( json.dumps({ "success": True }), "application/json" )

def index(request):
    # make sure CsrfResponseMiddleware sends a CSRF token cookie, so we can properly
    # authenticate our login form when it is submitted.
    request.META["CSRF_COOKIE_USED"] = True
    if not request.user.is_authenticated():
        return render_to_response('index_ext_unauthed.html', {
            'HAVE_KERBEROS': settings.HAVE_KERBEROS,
            }, context_instance = RequestContext(request))
    else:
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            profile = UserProfile(user=request.user, host=Host.objects.get_current())
            profile.save()

        if settings.ANGULAR_LOGIN:
            return HttpResponseRedirect("angular/login_oa.html")

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
            'LOCALHOST': Host.objects.get_current(),
            'INSTALLED_APPS': settings.INSTALLED_APPS,
            'INSTALLED_APP_TEMPLATES': found_templates
            }, context_instance = RequestContext(request))
