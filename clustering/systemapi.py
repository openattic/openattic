# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import socket

from django.template.loader import render_to_string

from systemd import invoke, logged, BasePlugin, method
from clustering.models   import ServiceIP4

@logged
class SystemD(BasePlugin):
    dbus_path = "/clustering"

    @method( in_signature="ss", out_signature="i")
    def resource_create_ip4(self, resname, address):
        return invoke([
            "/usr/sbin/crm", "configure", "primitive", resname, "ocf:heartbeat:IPaddr2",
            "op", "monitor", 'interval="10s"', 'timeout="20s"',
            "params", 'ip="%s"' % address
            ])

