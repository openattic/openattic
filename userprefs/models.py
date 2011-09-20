# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import json

from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.ForeignKey(User, unique=True)

    def __getitem__(self, item):
        try:
            pref = self.userpreference_set.get(setting=item)
        except UserPreference.DoesNotExist:
            raise KeyError( item )
        else:
            return json.loads(pref)

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
        unique_together=("profile", "setting")
