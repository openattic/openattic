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

from django.db import models
from django.contrib.auth.models import User

from ifconfig.models import Host


def get_default_user():
    user = User.objects.all()[0]
    print user
    return user.id


def get_default_host():
    host = Host.objects.get_current()
    print host
    return host.id


class UserPreference(models.Model):

    user = models.ForeignKey(User, default=get_default_user)
    host = models.ForeignKey(Host, default=get_default_host)
    setting = models.CharField(max_length=50)
    value = models.TextField()

    def __unicode__(self):
        return self.setting
