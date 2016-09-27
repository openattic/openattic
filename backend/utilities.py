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


def zip_by_keys(*args):
    """
    Zips lists of dicts by keys into one list of dicts.

    >>> l1 = [{'k1': 0, 'v1': 'hello'}, {'k1': 1, 'v1': 'Hallo'}]
    >>> l2 = [{'k2': 0, 'v2': 'world'}, {'k2': 1, 'v2': 'Welt'}]
    >>> r = zip_by_keys(('k1', l1), ('k2', l2))
    >>> assert r == [{'k1': 0, 'v1': 'hello', 'k2': 0, 'v2': 'world'},
    >>>              {'k1': 1, 'v1': 'Hallo', 'k2': 1, 'v2': 'Welt'}]

    :type args: tuple(tuple[str, Any]]
    :rtype: list[dict[str, Any]]
    """
    if not args:
        return []
    d = defaultdict(dict)
    for (key, l) in args:
        for elem in l:
            d[elem[key]].update(elem)
    keyname = args[0][0]
    return sorted(d.values(), key=lambda e: getattr(e, keyname, None))


def zip_by_key(key, *args):
    """
    Zip args by key.

    >>> l1 = [{'k': 0, 'v1': 'hello'}, {'k': 1, 'v1': 'Hallo'}]
    >>> l2 = [{'k': 0, 'v2': 'world'}, {'k': 1, 'v2': 'Welt'}]
    >>> r = zip_by_key('k', l1, l2)
    >>> assert r == [{'k': 0, 'v1': 'hello', 'v2': 'world'},
    >>>              {'k': 1, 'v1': 'Hallo', 'v2': 'Welt'}]

    :type key: str
    :type args: tuple[dict[str, Any]]
    :rtype: list[dict[str, Any]]
    """
    return zip_by_keys(*[(key, l) for l in args])
