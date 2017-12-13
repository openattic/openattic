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
import inspect
import os
from collections import defaultdict
from contextlib import closing
from distutils.spawn import find_executable
from importlib import import_module
from os import path

import django
import multiprocessing

from configobj import ConfigObj

logger = logging.getLogger(__name__)


def get_related_model(field):
    """
    Provides a Django 1.8 and pre-1.8 compatible version of
    >>> ..._meta.get_field_by_name(...)[0].related.parent_model  # doctest: +SKIP

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

        You can also overwrite keys:
    >>> assert aggregate_dict({1:2}, {1:4}) == {1:4}


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

    >>> l1 = [{'k1': 0, 'v1': 'hello'},
    ...       {'k1': 1, 'v1': 'Hallo'}]
    >>> l2 = [{'k2': 0, 'v2': 'world'},
    ...       {'k2': 1, 'v2': 'Welt'}]
    >>> r = zip_by_keys(('k1', l1), ('k2', l2))
    >>> assert r == [{'k1': 0, 'v1': 'hello', 'k2': 0, 'v2': 'world'},
    ...              {'k1': 1, 'v1': 'Hallo', 'k2': 1, 'v2': 'Welt'}]

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
    ...              {'k': 1, 'v1': 'Hallo', 'v2': 'Welt'}]

    :type key: str
    :type args: tuple[dict[str, Any]]
    :rtype: list[dict[str, Any]]
    """
    return zip_by_keys(*[(key, l) for l in args])


def get_django_app_modules(module_name):
    """Returns a list of app modules named `module_name`"""
    from django.conf import settings

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


def is_executable_installed(executable):
    """
    Tries to find an executable in the typical locations.
    :type executable: str
    :rtype: bool
    """
    if find_executable(executable):
        return True
    return any([path.isfile(path.join(root, executable)) for root in ['/sbin', '/usr/sbin']])


def run_in_external_process(func, cmd_name, timeout=30):
    """
    Runs `func` in an external process. Exceptions and return values are forwarded

    :type func: () -> T
    :type timeout: int
    :rtype: T
    """
    class LibradosProcess(multiprocessing.Process):
        def __init__(self, com_pipe):
            multiprocessing.Process.__init__(self)
            self.com_pipe = com_pipe

        def run(self):
            with closing(self.com_pipe):
                try:
                    self.com_pipe.send(func())
                except Exception as e:
                    logger.exception("Exception when running a librados process.")
                    self.com_pipe.send(e)

    com1, com2 = multiprocessing.Pipe()
    p = LibradosProcess(com2)
    p.start()
    with closing(com1):
        if com1.poll(timeout):
            res = com1.recv()
            p.join()
            if isinstance(res, Exception):
                raise res
            return res
        else:
            from exception import ExternalCommandError

            p.terminate()
            raise ExternalCommandError(
                'Command \'{}\' terminated because of timeout ({} sec).'.format(cmd_name, timeout))


def set_globals_from_file(my_globals, file_name):
    """
    >>> for settings_file in ('/etc/default/openattic', '/etc/sysconfig/openattic'): # doctest: +ELLIPSIS
    ...     set_globals_from_file(globals(), settings_file)
    Reading settings from /etc/.../openattic
    >>> OAUSER
    'openattic'


    :param my_globals:
    :param file_name:
    :return:
    """
    if os.access(file_name, os.R_OK):
        print('Reading settings from {}'.format(file_name))
        for key, val in ConfigObj(file_name).items():
            my_globals[key] = val


def read_single_setting(key):
    """
    >>> read_single_setting('OAUSER')
    'openattic'

    >>> read_single_setting('notfound')
    Traceback (most recent call last):
      File "/utilities.py", line 216, in read_single_setting
        return ConfigObj(file_name)[key]
      File "/site-packages/configobj.py", line 554, in __getitem__
        val = dict.__getitem__(self, key)
    KeyError: 'notfound'

    :raise KeyError: If the key isn't found
    """
    file_name = \
    [f for f in ('/etc/default/openattic', '/etc/sysconfig/openattic') if os.access(f, os.R_OK)][0]
    return ConfigObj(file_name)[key]


def write_single_setting(key, value, set_in_django_settings=True):
    """
    :raise dbus.DBusException: If connection to dbus failed.
    """
    import oa_settings

    if '-' in key:
        logger.warning('- in key "{}"'.format(key))

    if set_in_django_settings:
        from django.conf import settings as django_settings
        setattr(django_settings, key, value)
    conf_obj = ConfigObj(oa_settings.settings_file)

    def get_default(this_key):
        return '' if not conf_obj.has_key(this_key) else type(value)()

    def get_type(this_key):
        return type(value) if not conf_obj.has_key(this_key) else type(conf_obj[this_key])

    def get_value(this_key):
        return value if this_key == key else conf_obj[this_key]

    oa_settings.save_settings_generic([key], get_default, get_type, get_value)
    return conf_obj
