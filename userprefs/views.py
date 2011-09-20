# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import json

from django.http import HttpResponse

from userprefs.models import UserProfile

def get_prefs(request):
    try:
        profile = request.user.get_profile()
    except UserProfile.DoesNotExist:
        profile = UserProfile(user=request.user)
        profile.save()

    return HttpResponse(
        "window.InitDirectState = " + json.dumps(
            dict([( pref.setting, json.loads(pref.value)) for pref in profile])
        ) + ";\n", mimetype="text/javascript")
