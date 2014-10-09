# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import os.path
import ctypes

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method


@logged
class SystemD(BasePlugin):
    dbus_path = "/sysutils"

    @method(in_signature="", out_signature="i")
    def shutdown(self):
        return invoke(["init", "0"])

    @method(in_signature="", out_signature="i")
    def reboot(self):
        return invoke(["init", "6"])

    @method(in_signature="ss", out_signature="i")
    def run_initscript(self, sname, command):
        spath = os.path.join( "/etc/init.d", sname )
        if not os.path.exists(spath):
            raise ValueError("No such file or directory: '%s'" % spath)
        return invoke([spath, command], log=( command != "status" ), fail_on_err=False)

    @method(in_signature="i", out_signature="i")
    def set_time(self, seconds):
        librt = ctypes.cdll.LoadLibrary("librt.so")

        class timespec(ctypes.Structure):
            _fields_ = [
                ('tv_sec', ctypes.c_long),
                ('tv_nsec', ctypes.c_long)]

        timeobj = timespec(int(seconds), 0)
        return librt.clock_settime( 0, ctypes.pointer(timeobj) )
