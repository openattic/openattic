# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import logging
import dbus
from functools import wraps

def dbus_type_to_python(obj):
    """ Convert a single dbus something to its python equivalent. """
    conv = {
        dbus.Array: list,
        dbus.Dictionary: dict,
        dbus.Boolean: bool,
        dbus.Int16: int,
        dbus.Int32: int,
        dbus.Int64: int,
        dbus.String: unicode
        }
    return conv[type(obj)](obj)

def dbus_to_python(obj):
    """ Recursively convert a dbus something to its python equivalent,
        recursing over lists and dicts.
    """
    py = dbus_type_to_python(obj)
    if isinstance(py, list):
        return [dbus_to_python(el) for el in py]
    elif isinstance(py, dict):
        return dict([(dbus_type_to_python(key), dbus_to_python(obj[key])) for key in py])
    return py

def makeloggedfunc(func):
    """ Create a wrapper around the method that does some logging """
    if hasattr(func, "im_class") and hasattr(func.im_class, "dbus_path"):
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "Calling %s::%s(%s)", func.im_class.dbus_path, func.__name__,
                ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    else:
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "Calling %s(%s)", func.__name__,
                ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    return loggedfunc

def logged(cls):
    """ Search for methods that are exported via DBus and put a log wrapper around them """
    for attr in dir(cls):
        func = getattr(cls, attr)
        if hasattr(func, "_dbus_is_method") and \
           func._dbus_is_method and func.__name__ != "Introspect":
            setattr( cls, attr, makeloggedfunc(func) )
    return cls

