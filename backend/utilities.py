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
import django


def get_related_model(field):
    """
    Provides a Django 1.8 and pre-1.8 compatible version of
    >>> ..._meta.get_field_by_name(...)[0].related.parent_model

    :type field: django.db.models.Field
    :rtype: django.db.models.Model
    """
    if django.VERSION < (1, 8):
        return field.related.parent_model
    else:
        return field.related_model


def drf_version():
    """:rtype: tuple"""
    import rest_framework
    return tuple(map(int, rest_framework.VERSION.split('.')))


def get_request_query_params(request):
    """:type request: rest_framework.request.Request"""
    if drf_version() < (3, 0):
        return request.QUERY_PARAMS
    else:
        return request.query_params


def get_request_data(request):
    """
    `request.DATA` has been deprecated in favor of `request.data` since version 3.0, and has been
    fully removed as of version 3.2.

    :type request: rest_framework.request.Request
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


def aggregate_dict(*args, **kwargs):
    """
    >>> assert aggregate_dict({1:2}, {3:4}, a=5) == {1:2, 3:4, 'a':5}

    :rtype: dict
    """
    ret = {}
    for arg in args:
        ret.update(arg)
    ret.update(**kwargs)
    return ret
