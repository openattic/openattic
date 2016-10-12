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
from collections import defaultdict

import django
from django.http.request import QueryDict # Docstring


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

class ToNativeToRepresentationMixin(object):
    """DRF 3: `to_native` was replaced by `to_representation`"""

    def super_to_native_or_to_representation(self, obj):
        if drf_version() >= (3, 3):
            return super(ToNativeToRepresentationMixin, self).to_representation(obj)
        else:
            return super(ToNativeToRepresentationMixin, self).to_native(obj)

    def to_representation(self, instance):
        return self.to_native(instance)
