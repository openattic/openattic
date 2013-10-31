# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import threading
import logging
import dbus

from functools import wraps

from django.conf import settings

threadstore = threading.local()

def get_dbus_object(path="/"):
    if not hasattr(threadstore, "systemdbus"):
        threadstore.systemdbus = dbus.SystemBus(private=True)
    return threadstore.systemdbus.get_object(settings.DBUS_IFACE_SYSTEMD, path)

def dbus_type_to_python(obj):
    """ Convert a single dbus something to its python equivalent. """
    conv = {
        dbus.Array: list,
        dbus.Dictionary: dict,
        dbus.Boolean: bool,
        dbus.Int16: int,
        dbus.Int32: int,
        dbus.Int64: int,
        dbus.String: unicode,
        dbus.Struct: tuple,
        tuple: tuple
        }
    return conv[type(obj)](obj)

def dbus_to_python(obj):
    """ Recursively convert a dbus something to its python equivalent,
        recursing over lists and dicts.
    """
    py = dbus_type_to_python(obj)
    if isinstance(py, list):
        return [dbus_to_python(el) for el in py]
    elif isinstance(py, tuple):
        return tuple([dbus_to_python(el) for el in py])
    elif isinstance(py, dict):
        return dict([(dbus_type_to_python(key), dbus_to_python(obj[key])) for key in py])
    return py

def makeloggedfunc(func, action="Calling"):
    """ Create a wrapper around the method that does some logging """
    if hasattr(func, "im_class") and hasattr(func.im_class, "dbus_path"):
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "%s %s::%s(%s)", action, func.im_class.dbus_path, func.__name__,
                ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    else:
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "%s %s(%s)", action, func.__name__,
                ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    return loggedfunc

def logged(cls):
    """ Search for methods that are exported via DBus and put a log wrapper around them """
    for attr in dir(cls):
        func = getattr(cls, attr)
        if hasattr(func, "_dbus_is_method") and \
           func._dbus_is_method and func.__name__ != "Introspect" and \
           getattr(func, "_enable_logging", True):
            setattr( cls, attr, makeloggedfunc(func, "Calling") )
        elif hasattr(func, "_dbus_is_signal") and func._dbus_is_signal:
            setattr( cls, attr, makeloggedfunc(func, "Emitting") )
    return cls

def wrap_as_job(meth):
    @wraps(meth)
    def wrappedmeth(self, *args, **kwargs):
        sysd = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/")
        jid = sysd.build_job()
        ret = meth(self, jid, *args, **kwargs)
        sysd.enqueue_job(jid)
        return ret
    return wrappedmeth
