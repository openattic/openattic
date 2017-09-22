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

import os
import logging
from optparse import make_option

import gobject
import dbus
import dbus.service
import dbus.types
import dbus.mainloop.glib

from django.core.management.base import BaseCommand
from django.conf import settings

from systemd.plugins import makeloggedfunc
from utilities import get_django_app_modules
import taskqueue.manager

logger = logging.getLogger(__name__)


class SystemD(dbus.service.Object):
    """ Implements the main DBus section (/). """

    def __init__(self, detected_modules):
        bus = dbus.SystemBus()
        dbus.service.Object.__init__(self, bus, "/")
        busname = dbus.service.BusName(settings.DBUS_IFACE_SYSTEMD, bus)

        self.modules = {}  # store references to these modules in memory
        for module in detected_modules:
            try:
                daemon = getattr(module, "SystemD")
                self.modules[module.__name__] = daemon(bus, busname, self)
            except:
                logger.exception('No SystemD in {}'.format(module.__name__))

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="s")
    def ping(self):
        """ Return 'pong' for connectivity tests. """
        return "pong"


class Command( BaseCommand ):
    help = "Daemon that executes all commands for which root is needed."
    option_list = BaseCommand.option_list + (
        make_option("-l", "--logfile", help="Ignored for compatibility reason", default=None),
    )

    def handle(self, **options):
        if os.getuid() != 0:
            raise SystemError("Needs to run as root.")

        gobject.threads_init()

        os.environ["LANG"] = "en_US.UTF-8"

        sysdplugins = get_django_app_modules('systemapi')

        logging.info("Running")
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        loop = gobject.MainLoop()
        master = SystemD(sysdplugins)  # We need the object itself to stay

        taskqueue_manager = taskqueue.manager.TaskQueueManager()  # The object need to stay in mem.

        try:
            loop.run()
        except KeyboardInterrupt:
            loop.quit()
