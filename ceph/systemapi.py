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

from systemd       import invoke, logged, LockingPlugin, method

@logged
class SystemD(LockingPlugin):
    dbus_path = "/ceph"

    @method(in_signature="i", out_signature="s")
    def osd_crush_dump(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "osd", "crush", "dump"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def osd_dump(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "osd", "dump"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def mds_stat(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "mds", "stat"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def mon_status(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "mon_status"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def auth_list(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "auth", "list"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def status(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "status"], log=False, return_out_err=True)
        return out

    @method(in_signature="i", out_signature="s")
    def df(self, cluster):
        ret, out, err = invoke(["ceph", "--format", "json", "--cluster", cluster, "df"], log=False, return_out_err=True)
        return out
