# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import json

from rpcd.handlers import BaseHandler
from userprefs.models import UserProfile

class UserProfileHandler(BaseHandler):
    model = UserProfile

    def all_preferences(self):
        return dict([( pref.setting, json.loads(pref.value)) for pref in self.user.get_profile()])

    def has_preference(self, setting):
        return setting in self.user.get_profile()

    def get_preference_or_default(self, setting, default):
        if setting not in self.user.get_profile():
            return default
        return self.user.get_profile()[setting]

    def get_preference(self, setting):
        """ Get a setting from the current user's profile. """
        return self.user.get_profile()[setting]

    def set_preference(self, setting, value):
        """ Set a setting in the current user's profile. """
        self.user.get_profile()[setting] = value

    def clear_preference(self, setting):
        """ Clear a setting from the current user's profile. """
        del self.user.get_profile()[setting]

RPCD_HANDLERS = [UserProfileHandler]
