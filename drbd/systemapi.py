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

import os
import socket

from django.template.loader import render_to_string

from systemd import invoke, logged, BasePlugin, method, deferredmethod
from drbd.models import Connection, Endpoint

def stackcmd(resource, stacked, command, options=None):
    cmd = ["/sbin/drbdadm"]
    if stacked: cmd.append("-S")
    if options: cmd.extend(["--"] + options)
    cmd.extend([command, resource])
    return cmd

@logged
class SystemD(BasePlugin):
    dbus_path = "/drbd"

    @deferredmethod(in_signature="")
    def modprobe(self, sender):
        invoke(["modprobe", "drbd"])

    @deferredmethod(in_signature="sb")
    def createmd(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "create-md"), stdin="yes\n")

    @deferredmethod(in_signature="sb")
    def attach(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "attach"))

    @deferredmethod(in_signature="sb")
    def connect(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "connect"))

    @deferredmethod(in_signature="sb")
    def up(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "up"))

    @deferredmethod(in_signature="sb")
    def primary(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary"))

    @deferredmethod(in_signature="sb")
    def primary_overwrite(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary", ["--overwrite-data-of-peer"]))

    @deferredmethod(in_signature="sb")
    def primary_force(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary", ["--force"]))

    @deferredmethod(in_signature="sb")
    def secondary(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "secondary"))

    @deferredmethod(in_signature="sb")
    def adjust(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "adjust"))

    @deferredmethod(in_signature="sb")
    def disconnect(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "disconnect"))

    @deferredmethod(in_signature="sb")
    def detach(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "detach"))

    @deferredmethod(in_signature="sb")
    def down(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "down"))

    @deferredmethod(in_signature="sb")
    def pausesync(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "pause-sync"))

    @deferredmethod(in_signature="sb")
    def resumesync(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "resume-sync"))

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

    @deferredmethod( in_signature="")
    def conf_write(self, sender):
        # Iterate over top-level connections
        for conn in Connection.objects.all():
            # Check if this connection (tree) has anything to do with the current host.
            # This is the case if any of my own endpoints run here, or one of my
            # low level devices' endpoints do.
            #if not conn.endpoints_running_here and not conn.stacked:
            if not conn.endpoints_running_here:
                continue
            fd = open("/etc/drbd.d/%s.res" % conn.name, "w")
            try:
                #for lowerconn in conn.stack_child_set.all():
                #    fd.write( render_to_string( "drbd/device.res", {
                #        'Hostname':   socket.gethostname(),
                #        'Connection': lowerconn,
                #        'UpperConn':  conn
                #        } ) )

                fd.write( render_to_string( "drbd/device.res", {
                    'Hostname':   socket.gethostname(),
                    'Connection': conn,
                    'Endpoints':  Endpoint.all_objects.filter(connection=conn),
                    'UpperConn':  None
                    } ) )
            finally:
                fd.close()

    @deferredmethod( in_signature="i")
    def conf_delete(self, devid, sender):
        conn = Connection.objects.get(id=devid)
        os.unlink("/etc/drbd.d/%s.res" % conn.name)
