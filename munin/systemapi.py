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

import os
import os.path

from systemd       import invoke, logged, LockingPlugin, method
from munin.models  import MuninNode

@logged
class SystemD(LockingPlugin):
    dbus_path = "/munin"

    @method(in_signature="", out_signature="ississi")
    def autoconf(self):
        self.lock.acquire()
        try:
            mcret, mcout, mcerr = invoke(
                ["munin-node-configure", "--suggest", "--shell", "--remove-also"],
                return_out_err=True, fail_on_err=False)
            if mcout:
                shret, shout, sherr = invoke(["/bin/bash"], stdin=mcout, return_out_err=True, fail_on_err=False)
                rsret = invoke(["/etc/init.d/munin-node", "restart"])
            else:
                # Nothing to do
                shret = rsret = -1
                shout = sherr = ""
            return mcret, mcout, mcerr, shret, shout, sherr, rsret
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="iss")
    def get_suggestions(self):
        self.lock.acquire()
        try:
            mcret, mcout, mcerr = invoke(
                ["munin-node-configure", "--suggest", "--shell", "--remove-also"],
                return_out_err=True, fail_on_err=False)
            return mcret, mcout, mcerr
        finally:
            self.lock.release()


    @method(in_signature="", out_signature="ia(sbs)")
    def get_status(self):
        self.lock.acquire()
        try:
            mcret, mcout, mcerr = invoke(["munin-node-configure"], return_out_err=True)

            ret = []
            for line in mcout.split('\n')[2:]: # first two lines are headers
                if not line: continue
                plugin, used, extra = line.split('|')
                ret.append( (plugin.strip(), (used.strip() == 'yes'), extra.strip()) )

            return mcret, ret
        finally:
            self.lock.release()

    @method(in_signature="ss", out_signature="i")
    def install(self, plugin, install_as):
        self.lock.acquire()
        try:
            if not install_as:
                install_as = plugin
            fullsrc = os.path.join("/usr/share/munin/plugins", plugin)
            fulltgt = os.path.join("/etc/munin/plugins", install_as)
            if not os.path.exists(fullsrc):
                raise ReferenceError("No such plugin: %s" % plugin)
            if os.path.exists(fulltgt):
                raise ValueError("Plugin %s already exists" % install_as)
            os.symlink( fullsrc, fulltgt )
            return invoke(["/etc/init.d/munin-node", "restart"])
        finally:
            self.lock.release()

    @method(in_signature="s", out_signature="i")
    def uninstall(self, plugin):
        self.lock.acquire()
        try:
            fullsrc = os.path.join("/etc/munin/plugins", plugin)
            if not os.path.exists(fullsrc):
                raise ReferenceError("No such plugin: %s" % plugin)
            os.unlink( fullsrc )
            return invoke(["/etc/init.d/munin-node", "restart"])
        finally:
            self.lock.release()

