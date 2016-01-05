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

import threading
import logging
import dbus

from time import sleep
from functools import wraps

from django.conf import settings

threadstore = threading.local()

def get_dbus_object(path="/"):
    while True:
        if not hasattr(threadstore, "systemdbus") or threadstore.systemdbus is None:
            threadstore.systemdbus = dbus.SystemBus(private=True)
        try:
            return threadstore.systemdbus.get_object(settings.DBUS_IFACE_SYSTEMD, path)
        except dbus.DBusException:
            logging.error("Caught DBusException, reconnecting in one second")
            threadstore.systemdbus = None
            sleep(1)

def dbus_type_to_python(obj):
    """ Convert a single dbus something to its python equivalent. """
    conv = {
        dbus.Array: list,
        dbus.Double: float,
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


class InTransaction(Exception):
    pass

class Transaction(object):
    """ Collects deferrable systemd operations in a queue and runs it.

        Usage:

            with Transaction():
                <some code that does stuff and ultimately calls systemd>

            with Transaction(background=False):
                <some code that does stuff and ultimately calls systemd>

            with Transaction():
                <some code that does stuff and ultimately calls systemd>
                with Transaction():
                    <calls get merged into the outer transaction>

            with Transaction():
                <some code that does stuff and ultimately calls systemd>
                with Transaction(reentrant=False):
                    <raises InTransaction>

        In case of an exception, the queue will be discarded and no
        action will be taken. Otherwise, the transaction will either
        run in the background or block until the operations in the queue
        have finished, depending on the ``background`` parameter.

        If the ``reentrant`` parameter is set to True, nesting Transactions
        will not cause an error, but instead be merged into one.
    """
    def __init__(self, background=True, reentrant=True):
        self.background = background
        self.reentrant  = reentrant

    def __enter__(self):
        if hasattr(threadstore, "in_transaction") and threadstore.in_transaction:
            if not self.reentrant:
                raise InTransaction()
            else:
                return
        get_dbus_object("/").start_queue()
        threadstore.in_transaction = True

    def __exit__(self, type, value, traceback):
        if type is not None:
            # some exception occurred
            get_dbus_object("/").discard_queue()
        elif self.background:
            get_dbus_object("/").run_queue_background()
        else:
            get_dbus_object("/").run_queue()
        threadstore.in_transaction = False


