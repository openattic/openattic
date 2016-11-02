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
import logging
from collections import defaultdict
from importlib import import_module

import django
from django.conf import settings

logger = logging.getLogger(__name__)


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


def aggregate_dict(*args, **kwargs):
    """
    >>> assert aggregate_dict({1:2}, {3:4}, a=5) == {1:2, 3:4, 'a':5}

    :rtype: dict[str, Any]
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


def get_django_app_modules(module_name):
    """Returns a list of app modules named `module_name`"""
    plugins = []
    for app in settings.INSTALLED_APPS:
        try:
            module = import_module(app + "." + module_name)
        except ImportError, err:
            if unicode(err) != "No module named {}".format(module_name):
                logger.exception('Got error when checking app: {}'.format(app))
        else:
            plugins.append(module)
    logging.info("Loaded {} modules: {}".format(module_name,
                                                ', '.join([module.__name__ for module in plugins])))
    return plugins
