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

from rest_framework import serializers, viewsets

from userprefs.models import UserProfile, UserPreference


class UserPreferenceSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = UserPreference
        fields = ("setting", "value")

    def to_native(self, obj):
        return dict([(obj.setting, json.loads(obj.value))])


class UserProfileSerializer(serializers.HyperlinkedModelSerializer):

    preferences = serializers.SerializerMethodField("get_preferences")

    class Meta:
        model = UserProfile
        fields = ("url", "id", "host", "user", "preferences")

    def get_preferences(self, profile):
        user_pref_ser = UserPreferenceSerializer(profile, context=self.context, many=True)
        return user_pref_ser.data


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


RESTAPI_VIEWSETS = [
    ("userprofiles", UserProfileViewSet, "userprofile"),
]
