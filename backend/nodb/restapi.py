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
from django.core import validators
from rest_framework import serializers, viewsets

from rest.utilities import ToNativeToRepresentationMixin, drf_version

try:
    from rest_framework.fields import WritableField
except ImportError:
    # Django REST Framework 3.0 removed rest_framework.fields.WritableField
    from rest_framework.fields import Field as WritableField

import nodb.models


class JsonField(WritableField, ToNativeToRepresentationMixin):

    def to_native(self, value):
        """
        :return:Returns the value itself, not a string representation.
        """
        return value

    def from_native(self, value):
        if value in validators.EMPTY_VALUES:
            return None
        return value


if drf_version() < (3, 0):
    class NodbSerializer(serializers.ModelSerializer):
        field_mapping = dict(serializers.ModelSerializer.field_mapping.items()
                             + [(nodb.models.JsonField, JsonField)])

else:
    class NodbSerializer(serializers.ModelSerializer):
        serializer_field_mapping = dict(
            serializers.ModelSerializer.serializer_field_mapping.items() + [
                (nodb.models.JsonField, JsonField)])


class NodbViewSet(viewsets.ModelViewSet):

    def __init__(self, **kwargs):
        super(NodbViewSet, self).__init__(**kwargs)
        self.set_nodb_context(None)

    def set_nodb_context(self, context):
        nodb.models.NodbManager.set_nodb_context(context)
