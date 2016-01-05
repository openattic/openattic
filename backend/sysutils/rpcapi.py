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

import os
from time import time

from systemd import get_dbus_object
from rpcd.handlers import BaseHandler, ModelHandler
from sysutils.models import InitScript
from sysutils import sysstats

class SysUtilsHandler(BaseHandler):
    handler_name = "sysutils.System"

    def shutdown(self):
        """ Shut down the system. """
        get_dbus_object("/sysutils").shutdown()

    def reboot(self):
        """ Reboot the system. """
        get_dbus_object("/sysutils").reboot()

    def get_time(self):
        """ Return the current time as a UNIX timestamp. """
        return int(time())

    def set_time(self, timestamp):
        """ Set the current system time from the given `timestamp`. """
        return get_dbus_object("/sysutils").set_time(timestamp)

    def get_load_avg(self):
        """ Return the number of processes in the system run queue averaged over the last 1, 5, and 15 minutes. """
        return os.getloadavg()

    def get_cpu_percent(self):
        """ Return CPU utilization indicators in percent. """
        return sysstats.get_cpu_percent()

    def get_system_boot_time(self):
        """ Return the time the system was booted (in seconds since the epoch). """
        return sysstats.get_system_boot_time()

    def get_meminfo(self):
        """ Return memory use indicators in MiB. """
        meminfo = sysstats.get_meminfo()
        return dict([(key, meminfo[key] / 1024.) for key in
            ('MemTotal', 'MemFree', 'Buffers', 'Cached')])


class InitScriptHandler(ModelHandler):
    model = InitScript

    def get_status(self, id):
        """ Run the init script with the `status` command and return its exit status. """
        return InitScript.objects.get(id=id).status

    def all_with_status(self):
        """ Get all initscripts with their current status values """
        data = []
        for obj in self.model.objects.all():
            objdata = self._getobj(obj)
            objdata["status"] = obj.status
            data.append(objdata)
        return data

    def start(self, id):
        """ Start the service. """
        return InitScript.objects.get(id=id).start()

    def stop(self, id):
        """ Stop the service. """
        return InitScript.objects.get(id=id).stop()

RPCD_HANDLERS = [SysUtilsHandler, InitScriptHandler]
