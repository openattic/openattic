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

import logging

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType

from rest_framework import serializers, viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework.views import APIView

from rest import relations
from rest.utilities import mk_method_field_params, get_request_data, drf_version

logger = logging.getLogger(__name__)


class NoCacheAPIView(APIView):
    def dispatch(self, request, *args, **kwargs):
        response = super(NoCacheAPIView, self).dispatch(request, *args, **kwargs)

        if request.method == 'GET':
            # TODO: if Django >= 1.8.8 replace it with django.utils.cache.add_never_cache_headers
            response['Cache-Control'] = 'no-cache'

        return response


class NoCacheModelViewSet(viewsets.ModelViewSet, NoCacheAPIView):
    pass


class NoCacheReadOnlyModelViewSet(viewsets.ReadOnlyModelViewSet, NoCacheAPIView):
    pass


class ContentTypeSerializer(serializers.HyperlinkedModelSerializer):
    if drf_version() >= (3, 0):
        name = serializers.CharField()  # in DRF 3, `name` is no longer automatically generated.

    class Meta:
        model = ContentType


class ContentTypeViewSet(NoCacheReadOnlyModelViewSet):
    queryset = ContentType.objects.all()
    serializer_class = ContentTypeSerializer


# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    auth_token = serializers.SerializerMethodField(*mk_method_field_params('auth_token'))
    profile = relations.HyperlinkedIdentityField(view_name='userprofile-detail')

    class Meta:
        model = User
        fields = ('url', 'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
                  'is_staff', 'is_superuser', 'last_login', 'date_joined', 'auth_token',
                  'profile')

    def get_auth_token(self, obj):
        current_user = self.context["request"].user

        try:
            token = Token.objects.get(user=obj)
        except Token.DoesNotExist:
            return {"token": "Not set yet!"}

        # If the requesting user is not the user the authentication token should be returned
        # for the key is masked so that users can only see their own token.
        if current_user != obj:
            token.key = "*******"
        return {"token": token.key, "createdate": token.created}


# ViewSets define the view behavior.
class UserViewSet(NoCacheModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_fields = ('username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff',
                     'is_superuser')
    search_fields = ('username', 'first_name', 'last_name', 'email')

    @detail_route(["post", "put"])
    def gen_new_token(self, request, *args, **kwargs):
        user = self.get_object()

        # Every user can have one authentication token at most, so check if a
        # token already exists and if yes delete it.
        try:
            token = Token.objects.get(user=user)
        except Token.DoesNotExist:
            pass
        else:
            # If requesting user is not the user the authentication should be created for return
            # error response. An user can only generate a token for another user if the other user
            # does not already have an authentication token.
            if request.user != user:
                logger.warning('User action canceled: user \'{}\' tried to refresh the '
                               'authentication token of user \'{}\'.'.format(request.user, user))
                return Response({'detail': 'You are not allowed to refresh the authentication '
                                           'token of another user.'},
                                status=status.HTTP_403_FORBIDDEN)
            token.delete()

        Token.objects.create(user=user)

        user_ret = UserSerializer(user, many=False, context={"request": request})
        return Response(user_ret.data, status=status.HTTP_201_CREATED)

    @list_route()
    def current(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user, many=False, context={"request": request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        user_data = get_request_data(request)
        user = User.objects.create_user(user_data["username"], user_data["email"],
                                        user_data["password"])
        user.first_name = user_data["first_name"]
        user.last_name = user_data["last_name"]
        user.is_active = user_data["is_active"]
        user.is_superuser = user_data["is_superuser"]
        user.is_staff = user_data["is_staff"]
        user.save()

        user_ret = UserSerializer(user, context={"request": request})
        return Response(user_ret.data, status=status.HTTP_201_CREATED)

    def update(self, request, partial=False, *args, **kwargs):
        self.object = self.get_object()
        req_user = request.user

        if self.object == req_user or req_user.is_superuser:
            data = get_request_data(request)

            serializer = self.get_serializer(self.object, data=data, partial=partial)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            if 'password' in data:
                self.object.set_password(data['password'])
            self.object = serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {'detail': 'Administrator privileges are required for updating the data of user {}.'
                .format(self.object.username)},
            status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        self.object = self.get_object()
        req_user = request.user

        if self.object == req_user:
            return Response({'detail': 'You can\'t delete your own user account.'},
                            status=status.HTTP_403_FORBIDDEN)

        return super(UserViewSet, self).destroy(request, args, kwargs)


RESTAPI_VIEWSETS = [
    ('users', UserViewSet),
    ('contenttypes', ContentTypeViewSet),
]
