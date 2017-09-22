# -*- coding: utf-8 -*-

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

from rest_framework import serializers, status, mixins
from rest_framework.response import Response

from userprefs.models import UserProfile, UserPreference

from rest.utilities import drf_version, get_request_query_params, mk_method_field_params, \
    get_request_data, ToNativeToRepresentationMixin, get_paginated_response
from rest.restapi import NoCacheReadOnlyModelViewSet


class UserPreferenceSerializer(ToNativeToRepresentationMixin,
                               serializers.HyperlinkedModelSerializer):

    class Meta:
        model = UserPreference
        fields = ("setting", "value")

    def to_native(self, obj):
        return (obj.setting, json.loads(obj.value))


class UserProfileSerializer(serializers.HyperlinkedModelSerializer):

    preferences = serializers.SerializerMethodField(*mk_method_field_params('preferences'))

    class Meta:
        model = UserProfile
        fields = ("url", "id", "user", "preferences")

    def get_preferences(self, profile):
        filter_values = get_request_query_params(self.context["request"]).get("search")

        if filter_values:
            filter_values = filter_values.split(",")
            profile = profile.filter_prefs(filter_values)

        user_pref_ser = UserPreferenceSerializer(profile, context=self.context, many=True)
        return dict(user_pref_ser.data)


class UserProfileViewSet(NoCacheReadOnlyModelViewSet, mixins.CreateModelMixin,
                         mixins.DestroyModelMixin):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    def create(self, request, *args, **kwargs):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        for key, value in get_request_data(request).items():
            profile[key] = value

        profile_ser = self.get_serializer(profile, many=False)
        return Response(profile_ser.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()

        if profile.user != request.user:
            return Response({'detail': 'You are not allowed to delete preferences of other users'},
                            status=status.HTTP_401_UNAUTHORIZED)

        settings = get_request_data(request)["settings"]

        for setting in settings:
            try:
                del profile[setting]
            except:
                pass

        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        result_profiles = []

        for profile in queryset:
            if profile.user == request.user:
                result_profiles.append(profile)

        return get_paginated_response(self, result_profiles)

    def retrieve(self, request, *args, **kwargs):
        profile = self.get_object()

        if profile.user != request.user:
            return Response({'detail': 'You are not allowed to access profiles of other users'},
                            status=status.HTTP_401_UNAUTHORIZED)

        profile_ser = self.get_serializer(profile, many=False)
        return Response(profile_ser.data, status=status.HTTP_200_OK)

RESTAPI_VIEWSETS = [
    ("userprofiles", UserProfileViewSet, "userprofile"),
]
