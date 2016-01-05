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

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/clustering"

    @method(in_signature="ss", out_signature="i")
    def resource_create_ip4(self, resname, address):
        return invoke([
            "/usr/sbin/crm", "configure", "primitive", resname, "ocf:heartbeat:IPaddr2",
            "op", "monitor", 'interval="10s"', 'timeout="20s"',
            "params", 'ip="%s"' % address
            ])

    @method(in_signature="s", out_signature="")
    def resource_create_drbd(self, resname):
        invoke([
            "/usr/sbin/crm", "configure", "primitive", ("drbd_%s" % resname), "ocf:linbit:drbd",
            "params", ('drbd_resource="%s"' % resname),
            "op", "monitor", 'interval="15"', 'role="Master"',
            "op", "monitor", 'interval="20"', 'role="Slave"',
            "op", "start", 'interval="0"', 'timeout="240"'
            "op", "stop", 'interval="0"', 'timeout="100'
            ])

        invoke([
            "/usr/sbin/crm", "configure", "ms", ("ms_drbd_%s" % resname), ("drbd_%s" % resname),
            "meta" 'master-max="1"', 'master-node-max="1"', 'clone-max="2"', 'clone-node-max="1"',
            'notify="true"', 'target-role="Started"'
            ])

    @method(in_signature="sss", out_signature="")
    def resource_create_drbd_fs(self, resname, mountpoint, fstype):
        invoke([
            "/usr/sbin/crm", "configure", "primitive", ("fs_%s" % resname), "ocf:heartbeat:Filesystem",
            "params", ('device="/dev/drbd/by-res/%s"' % resname),
                      ('directory="%s"' % mountpoint),
                      ('fstype="%s"' % fstype),
            "op", "start", 'interval="0"', 'timeout="60"',
            'op', 'stop', 'interval="0"', 'timeout="60"',
            'meta', 'target-role="Started"'])

        invoke([
            "/usr/sbin/crm", "configure", "colocation",
            ("fs_%s_on_drbd_%s" % (resname, resname)), "inf:",
            ("fs_%s" % resname),
            ("ms_drbd_%s:Master" % resname)
            ])

        invoke([
            "/usr/sbin/crm", "configure", "order",
            ("drbd_%s_then_fs_%s" % (resname, resname)), "inf:",
            ("ms_drbd_%s:promote" % resname),
            ("fs_%s:start" % resname)
            ])

    @method(in_signature="ss", out_signature="")
    def resource_follow_drbd(self, res, drbdres):
        invoke([
            "/usr/sbin/crm", "configure", "colocation",
            ("%s_on_drbd_%s" % (res, drbdres)), "inf:",
            res, ("ms_drbd_%s:Master" % drbdres)
            ])

        invoke([
            "/usr/sbin/crm", "configure", "order",
            ("drbd_%s_then_%s" % (drbdres, res)), "inf:",
            ("ms_drbd_%s:promote" % drbdres),
            ("%s:start" % res)
            ])
