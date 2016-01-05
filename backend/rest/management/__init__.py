# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import sysutils.models

from django.contrib.auth.models import User

from rest_framework.authtoken.models import Token

def create_auth_token(**kwargs):
    if User.objects.count() == 0:
        print "Can't create authentication token, no users have been configured yet"
        return

    try:
        user = User.objects.get(username="openattic", is_superuser=True)
    except User.DoesNotExist:
        print "Can't create authentication token. User 'openattic' does not exist."
        return

    try:
        user.auth_token
    except Token.DoesNotExist:
        Token.objects.create(user=user)
    else:
        print "The authentication token for 'openattic' does already exist."
        return

sysutils.models.post_install.connect(create_auth_token, sender=sysutils.models)