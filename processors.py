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

from userprefs.models import UserProfile
from ifconfig.models  import Host

def project_url(request):
    from django.conf import settings
    return {'PROJECT_URL': settings.PROJECT_URL}

def profile(request):
    if not request.user.is_authenticated():
        return {}
    else:
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            localhost = Host.objects.get_current()
            profile = UserProfile(user=request.user, host=localhost)
            profile.save()

        return {"PROFILE": profile}

