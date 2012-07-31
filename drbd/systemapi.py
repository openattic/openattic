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
import socket

from django.template.loader import render_to_string

from systemd import invoke, logged, BasePlugin, method
from ifconfig.models import Host
from drbd.models   import Connection, Endpoint

def stackcmd(resource, stacked, command, options=None):
    cmd = ["/sbin/drbdadm"]
    if stacked: cmd.append("-S")
    if options: cmd.extend(["--" + options)
    cmd.extend([command, resource])
    return cmd

@logged
class SystemD(BasePlugin):
    dbus_path = "/drbd"

    @method( in_signature="sb", out_signature="i")
    def createmd(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "create-md"), stdin="yes\n")

    @method( in_signature="sb", out_signature="i")
    def attach(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "attach"))

    @method( in_signature="sb", out_signature="i")
    def connect(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "connect"))

    @method( in_signature="sb", out_signature="i")
    def up(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "up"))

    @method( in_signature="sb", out_signature="i")
    def primary(self, resource, stacked):
        return invoke(["/sbin/drbdadm", "--", "primary", resource])

    @method( in_signature="sb", out_signature="i")
    def primary_overwrite(self, resource, stacked):
        return invoke(["/sbin/drbdadm", "--", "--overwrite-data-of-peer", "primary", resource])

    @method( in_signature="sb", out_signature="i")
    def primary_force(self, resource, stacked):
        return invoke(["/sbin/drbdadm", "--", "--force", "primary", resource])

    @method( in_signature="sb", out_signature="i")
    def secondary(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "secondary"))

    @method( in_signature="sb", out_signature="i")
    def adjust(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "adjust"))

    @method( in_signature="sb", out_signature="i")
    def disconnect(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "disconnect"))

    @method( in_signature="sb", out_signature="i")
    def detach(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "detach"))

    @method( in_signature="sb", out_signature="i")
    def down(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "down"))

    @method( in_signature="sb", out_signature="i")
    def pausesync(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "pause-sync"))

    @method( in_signature="sb", out_signature="i")
    def resumesync(self, resource, stacked):
        return invoke(stackcmd(resource, stacked, "resume-sync"))

    @method( in_signature="sb", out_signature="a{ss}")
    def get_dstate(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "dstate"), return_out_err=True, log=False)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="sb", out_signature="s")
    def get_cstate(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "cstate"), return_out_err=True, log=False)
        return out.strip()

    @method( in_signature="sb", out_signature="a{ss}")
    def get_role(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "role"), return_out_err=True, log=False)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="", out_signature="")
    def conf_write(self):
        # Iterate over top-level connections
        for conn in Connection.objects.filter(stack_parent__isnull=True):
            # Check if this connection (tree) has anything to do with the current host.
            # This is the case if any of my own endpoints run here, or one of my
            # low level devices' endpoints do.
            if not conn.endpoints_running_here and not conn.stacked:
                continue
            fd = open("/etc/drbd.d/%s.res" % conn.res_name, "w")
            try:
                for lowerconn in conn.stack_child_set.all():
                    fd.write( render_to_string( "drbd/device.res", {
                        'Hostname':   socket.gethostname(),
                        'Connection': lowerconn,
                        'UpperConn':  conn
                        } ) )

                fd.write( render_to_string( "drbd/device.res", {
                    'Hostname':   socket.gethostname(),
                    'Connection': conn,
                    'UpperConn':  None
                    } ) )
            finally:
                fd.close()

    @method( in_signature="i", out_signature="")
    def conf_delete(self, devid):
        conn = Connection.objects.get(id=devid)
        os.unlink("/etc/drbd.d/%s.res" % conn.res_name)
