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

# Don't import Views, otherwise you get a circular import in pagination.PageSizePageNumberPagination
from django.http.request import QueryDict  # Docstring
from django_filters import Filter
from rest_framework.response import Response


def drf_version():
    """:rtype: tuple"""
    import rest_framework
    return tuple(map(int, rest_framework.VERSION.split('.')))


def get_request_query_params(request):
    """
    DRF 3.0 renamed rest_framework.request.Request.QUERY_PARAMS to
    rest_framework.request.Request.query_params.

    :type request: rest_framework.request.Request
    :rtype: QueryDict
    """
    if drf_version() < (3, 0):
        return request.QUERY_PARAMS
    else:
        return request.query_params


def get_request_query_filter_data(request, filter_key):
    """
    Returns the comma separated filter parameters of a request as list.

    :param request: Request object including the filter
    :type request: rest_framework.request.Request
    :param filter_key: Name/key of the filter in the request object
    :type filter_key: str
    :return: List of filter parameters or None if filter_key not found in request
    :rtype: list[str] | None
    """
    filter_data = get_request_query_params(request).get(filter_key, None)

    if filter_data:
        filter_data = filter_data.split(',')

    return filter_data


def get_request_data(request):
    """
    `request.DATA` has been deprecated in favor of `request.data` since version 3.0, and has been
    fully removed as of version 3.2.

    :type request: rest_framework.request.Request
    :rtype: QueryDict
    """
    if drf_version() < (3, 0):
        return request.DATA
    else:
        return request.data


def mk_method_field_params(field_name):
    """
    In DRF 2.4, serializers.SerializerMethodField() requires the method name. In DRF 3.3, the
    method name MUST not be provided, if it equals the default generated one.

    Usage:
    >>> from rest_framework import serializers
    >>> field_name = serializers.SerializerMethodField(*mk_method_field_params('field_name'))

    This is stupid.
    """
    if drf_version() >= (3, 3):
        return []
    else:
        return ['get_{}'.format(field_name)]


def get_paginated_response(viewset_obj, queryset):
    page = viewset_obj.paginate_queryset(queryset)
    if page is not None:
        if drf_version() >= (3, 1):
            serializer = viewset_obj.get_serializer(page, many=True)
            return viewset_obj.get_paginated_response(serializer.data)
        else:
            serializer = viewset_obj.get_pagination_serializer(page)
            return Response(serializer.data)
    else:
        serializer = viewset_obj.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ToNativeToRepresentationMixin(object):
    """DRF 3: `to_native` was replaced by `to_representation`"""

    def super_to_native_or_to_representation(self, obj):
        if drf_version() >= (3, 3):
            return super(ToNativeToRepresentationMixin, self).to_representation(obj)
        else:
            return super(ToNativeToRepresentationMixin, self).to_native(obj)

    def to_representation(self, instance):
        return self.to_native(instance)


class DeleteCreateMixin(object):
    """
    In DRF 3, `restore_object()` was replace by `create()` and `update()`.

    This mixin will create either `restore_object()` or `create()` and `update()`. depending
    on the DRF version.

    Usage:

    >>> class FooSerializer(DeleteCreateMixin, Serializer):
    >>>
    >>> def update_validated_data(self, attrs):
    >>>     attrs["volume"] = attrs["volume.storageobj"].filesystemvolume_or_none
    >>>     del attrs["volume.storageobj"]
    >>>     return attrs
    """

    def update_validated_data(self, validated_data):
        raise NotImplementedError()

    if drf_version() >= (3, 0):
        def create(self, validated_data):  # DRF 3
            validated_data = self.update_validated_data(validated_data)
            return super(DeleteCreateMixin, self).create(validated_data)

        def update(self, instance, validated_data):  # DRF 3
            validated_data = self.update_validated_data(validated_data)
            return super(DeleteCreateMixin, self).update(instance, validated_data)
    else:
        def restore_object(self, attrs, instance=None):  # DRF 2
            attrs = self.update_validated_data(attrs)
            return super(DeleteCreateMixin, self).restore_object(attrs, instance)


class CommaSeparatedValueFilter(Filter):
    """Accept comma separated string as value and convert it to list.
    It's useful for __in lookups.
    """

    def filter(self, qs, value):
        if value:
            value.split(',')
        if value in ([], (), {}, None, ''):
            return qs
        return qs.filter(**{'%s__%s' % (self.name, self.lookup_type): value})
