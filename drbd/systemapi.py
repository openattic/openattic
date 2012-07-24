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

@logged
class SystemD(BasePlugin):
    dbus_path = "/drbd"

    @method( in_signature="s", out_signature="i")
    def createmd(self, resource):
        return invoke(["/sbin/drbdadm", "create-md", resource], stdin="yes\n")

    @method( in_signature="s", out_signature="i")
    def attach(self, resource):
        return invoke(["/sbin/drbdadm", "attach", resource])

    @method( in_signature="s", out_signature="i")
    def connect(self, resource):
        return invoke(["/sbin/drbdadm", "connect", resource])

    @method( in_signature="s", out_signature="i")
    def up(self, resource):
        return invoke(["/sbin/drbdadm", "up", resource])

    @method( in_signature="s", out_signature="i")
    def primary(self, resource):
        return invoke(["/sbin/drbdadm", "--", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def primary_overwrite(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--overwrite-data-of-peer", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def primary_force(self, resource):
        return invoke(["/sbin/drbdadm", "--", "--force", "primary", resource])

    @method( in_signature="s", out_signature="i")
    def secondary(self, path):
        return invoke(["/sbin/drbdadm", "--", path, "secondary"])

    @method( in_signature="s", out_signature="i")
    def adjust(self, resource):
        return invoke(["/sbin/drbdadm", "adjust", resource])

    @method( in_signature="s", out_signature="i")
    def disconnect(self, resource):
        return invoke(["/sbin/drbdadm", "disconnect", resource])

    @method( in_signature="s", out_signature="i")
    def detach(self, resource):
        return invoke(["/sbin/drbdadm", "detach", resource])

    @method( in_signature="s", out_signature="i")
    def down(self, resource):
        return invoke(["/sbin/drbdadm", "down", resource])

    @method( in_signature="s", out_signature="i")
    def pausesync(self, resource):
        return invoke(["/sbin/drbdadm", "pause-sync", resource])

    @method( in_signature="s", out_signature="i")
    def resumesync(self, resource):
        return invoke(["/sbin/drbdadm", "resume-sync", resource])

    @method( in_signature="sb", out_signature="a{ss}")
    def get_dstate(self, resource, stacked):
        ret, out, err = invoke(["/sbin/drbdadm"] + (stacked and ["-S"] or []) + ["dstate", resource], return_out_err=True, log=False)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="sb", out_signature="s")
    def get_cstate(self, resource, stacked):
        ret, out, err = invoke(["/sbin/drbdadm"] + (stacked and ["-S"] or []) + ["cstate", resource], return_out_err=True, log=False)
        return out.strip()

    @method( in_signature="sb", out_signature="a{ss}")
    def get_role(self, resource, stacked):
        ret, out, err = invoke(["/sbin/drbdadm"] + (stacked and ["-S"] or []) + ["role", resource], return_out_err=True, log=False)
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
