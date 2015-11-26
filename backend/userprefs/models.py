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

from django.db import models
from django.contrib.auth.models import User

from ifconfig.models import Host, HostDependentManager

class UserProfile(models.Model):
    user = models.ForeignKey(User)
    host = models.ForeignKey(Host)

    objects = HostDependentManager()

    class Meta:
        unique_together = ("user", "host")

    def __getitem__(self, item):
        try:
            pref = self.userpreference_set.get(setting=item)
        except UserPreference.DoesNotExist:
            raise KeyError( item )
        else:
            return json.loads(pref.value)

    def __setitem__(self, item, value):
        try:
            pref = self.userpreference_set.get(setting=item)
        except UserPreference.DoesNotExist:
            pref = UserPreference(profile=self, setting=item)
        pref.value = json.dumps(value)
        pref.save()
        return value

    def __delitem__(self, item):
        try:
            pref = self.userpreference_set.get(setting=item)
        except UserPreference.DoesNotExist:
            raise KeyError( item )
        else:
            pref.delete()

    def __contains__(self, item):
        try:
            self.userpreference_set.get(setting=item)
        except UserPreference.DoesNotExist:
            return False
        else:
            return True

    def __len__(self):
        return self.userpreference_set.count()

    def __iter__(self):
        return iter(self.userpreference_set.all())

class UserPreference(models.Model):
    profile = models.ForeignKey(UserProfile)
    setting = models.CharField(max_length=50)
    value   = models.TextField()

    class Meta:
        unique_together = ("profile", "setting")

    def __unicode__(self):
        return "<UserPreference %s>" % self.setting
