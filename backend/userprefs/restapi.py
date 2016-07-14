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

import json

from rest_framework import serializers, status, viewsets, mixins
from rest_framework.response import Response

from ifconfig.models import Host
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
        filter_values = self.context["request"].QUERY_PARAMS.get("search")
        if filter_values:
            filter_values = filter_values.split(",")
            profile = profile.filter_prefs(filter_values)

        user_pref_ser = UserPreferenceSerializer(profile, context=self.context, many=True)
        return user_pref_ser.data


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet, mixins.CreateModelMixin,
                         mixins.DestroyModelMixin):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    def create(self, request, *args, **kwargs):
        host = Host.objects.get_current()
        profile, _ = UserProfile.objects.get_or_create(user=request.user, host=host)

        for key, value in request.DATA.items():
            profile[key] = value

        profile_ser = UserProfileSerializer(profile, context={"request": request}, many=False)
        return Response(profile_ser.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()

        if profile.user != request.user:
            return Response("You are not allowed to delete preferences of other users",
                            status=status.HTTP_401_UNAUTHORIZED)

        settings = request.DATA["settings"]

        for setting in settings:
            try:
                del profile[setting]
            except:
                pass

        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, *args, **kwargs):
        host = Host.objects.get_current()
        queryset = self.get_queryset()
        result_profiles = []

        for profile in queryset:
            if profile.user == request.user and profile.host == host:
                result_profiles.append(profile)

        profile_ser = UserProfileSerializer(result_profiles, context={"request": request},
                                            many=True)
        return Response(profile_ser.data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()

        if profile.user != request.user:
            return Response("You are not allowed to access other users profiles",
                            status=status.HTTP_401_UNAUTHORIZED)

        profile_ser = UserProfileSerializer(profile, context={"request": request}, many=False)
        return Response(profile_ser.data, status=status.HTTP_200_OK)

RESTAPI_VIEWSETS = [
    ("userprofiles", UserProfileViewSet, "userprofile"),
]
