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

import threading
import logging
import dbus

from time import sleep

from django.conf import settings

threadstore = threading.local()


def get_dbus_object(path="/", timeout=30):
    for _ in range(timeout):
        if not hasattr(threadstore, "systemdbus") or threadstore.systemdbus is None:
            threadstore.systemdbus = dbus.SystemBus(private=True)
        try:
            return threadstore.systemdbus.get_object(settings.DBUS_IFACE_SYSTEMD, path)
        except dbus.DBusException:
            logging.error("Caught DBusException, reconnecting in one second")
            threadstore.systemdbus = None
            sleep(1)

    # Raise Exception. In general, this is better than playing dead.
    raise dbus.DBusException('Unable to connect to openattic-systemd')
