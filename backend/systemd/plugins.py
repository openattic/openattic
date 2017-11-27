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
import dbus.service
from functools import partial, wraps

from django.conf import settings


class BasePlugin(dbus.service.Object):
    """ Basic SystemD plugin that handles DBus object initialization properly.

        Classes that inherit from this class MUST define a `dbus_path` property,
        in which the object path is defined under which this object is to be exported.
    """
    def __init__(self, bus, busname, mainobj):
        self.bus = bus
        self.busname = busname
        self.mainobj = mainobj
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)


method = partial(dbus.service.method, settings.DBUS_IFACE_SYSTEMD)
signal = partial(dbus.service.signal, settings.DBUS_IFACE_SYSTEMD)

method.__doc__ = "Method decorator that has the DBus Interface pre-defined."
signal.__doc__ = "Signal decorator that has the DBus Interface pre-defined."


def makeloggedfunc(func, action="Calling"):
    """ Create a wrapper around the method that does some logging

    Used as a decorator:

    >>> @makeloggedfunc
    ... def foo():
    ...     return 42
    >>> foo()
    42

    """
    if hasattr(func, "im_class") and hasattr(func.im_class, "dbus_path"):
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info("%s %s::%s(%s)", action, func.im_class.dbus_path, func.__name__,
                         ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    else:
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info("%s %s(%s)", action, func.__name__,
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
            setattr(cls, attr, makeloggedfunc(func, "Calling"))
        elif hasattr(func, "_dbus_is_signal") and func._dbus_is_signal:
            setattr(cls, attr, makeloggedfunc(func, "Emitting"))
    return cls
