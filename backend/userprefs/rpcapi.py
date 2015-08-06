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

import json

from rpcd.handlers import ModelHandler
from userprefs.models import UserProfile

class UserProfileHandler(ModelHandler):
    model = UserProfile

    def all_preferences(self):
        """ Return a dict with all preferences for the current user profile. """
        profile = UserProfile.objects.get(user=self.user)
        return dict([( pref.setting, json.loads(pref.value)) for pref in profile])

    def has_preference(self, setting):
        """ See if the user profile has the given `setting`. """
        profile = UserProfile.objects.get(user=self.user)
        return setting in profile

    def get_preference_or_default(self, setting, default):
        """ Get the given `setting` if it is set, `default` otherwise. """
        profile = UserProfile.objects.get(user=self.user)
        if setting not in profile:
            return default
        return profile[setting]

    def get_preference(self, setting):
        """ Get a setting from the current user's profile. """
        profile = UserProfile.objects.get(user=self.user)
        return profile[setting]

    def set_preference(self, setting, value):
        """ Set a setting in the current user's profile. """
        profile = UserProfile.objects.get(user=self.user)
        profile[setting] = value

    def clear_preference(self, setting):
        """ Clear a setting from the current user's profile. """
        profile = UserProfile.objects.get(user=self.user)
        del profile[setting]

RPCD_HANDLERS = [UserProfileHandler]
