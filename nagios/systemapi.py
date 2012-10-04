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

import re

from time import time

from django.template.loader import render_to_string
from django.contrib.auth.models import User

from ifconfig.models import Host
from systemd       import invoke, logged, LockingPlugin, method, create_job
from nagios.models import Command, Service
from nagios.conf   import settings as nagios_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/nagios"

    @method(in_signature="", out_signature="")
    def write_services(self):
        self.lock.acquire()
        try:
            for host in Host.objects.all():
                fd = open( "/etc/nagios3/conf.d/openattic_%s.cfg" % host.name, "wb" )
                try:
                    fd.write( render_to_string( "nagios/services.cfg", {
                        "Host":     host,
                        "Commands": Command.objects.all(),
                        "Services": Service.objects.services_for_host(host).filter( command__query_only=False )
                        } ) )
                finally:
                    fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="")
    def write_contacts(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/nagios3/conf.d/openattic_contacts.cfg", "wb" )
            try:
                fd.write( render_to_string( "nagios/contacts.cfg", {
                    "Admins": User.objects.filter(is_active=True, is_superuser=True).exclude(email=""),
                    } ) )
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="")
    def restart(self):
        create_job([
            ["nagios3", "--verify-config", "/etc/nagios3/nagios.cfg"],
            ["/etc/init.d/nagios3", "restart"]
            ])

    @method(in_signature="", out_signature="i")
    def check_conf(self):
        return invoke(["nagios3", "--verify-config", "/etc/nagios3/nagios.cfg"])

    @method(in_signature="s", out_signature="")
    def schedule_host(self, hostname):
        with open(nagios_settings.CMD_PATH, "wb") as cmd:
            cmd.write("[%lu] SCHEDULE_FORCED_HOST_CHECK;%s;%d\n" % (time(), hostname, time()))

    @method(in_signature="s", out_signature="")
    def schedule_host_services(self, hostname):
        with open(nagios_settings.CMD_PATH, "wb") as cmd:
            cmd.write("[%lu] SCHEDULE_FORCED_HOST_SVC_CHECKS;%s;%d\n" % (time(), hostname, time()))

    @method(in_signature="ss", out_signature="")
    def schedule_service(self, hostname, servicedesc):
        with open(nagios_settings.CMD_PATH, "wb") as cmd:
            cmd.write("[%lu] SCHEDULE_FORCED_SVC_CHECK;%s;%s;%d\n" % (time(), hostname, servicedesc, time()))

    @method(in_signature="ssis", out_signature="ii")
    def iptables_install_rules(self, device, socketproto, portno, protocolname):
        inp = invoke([
            "iptables", "-I", "INPUT", "-p", socketproto,
            "-i", device, "--dport", str(portno), "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:IN" % ( device.upper(), protocolname.upper() )
            ])
        outp = invoke([
            "iptables", "-I", "OUTPUT", "-p", socketproto,
            "-o", device, "--sport", str(portno), "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:OUT" % ( device.upper(), protocolname.upper() )
            ])
        return inp, outp

    @method(in_signature="ssis", out_signature="ii")
    def iptables_remove_rules(self, device, socketproto, portno, protocolname):
        inp = invoke([
            "iptables", "-D", "INPUT", "-p", socketproto,
            "-i", device, "--dport", str(portno), "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:IN" % ( device.upper(), protocolname.upper() )
            ])
        outp = invoke([
            "iptables", "-D", "OUTPUT", "-p", socketproto,
            "-o", device, "--sport", str(portno), "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:OUT" % ( device.upper(), protocolname.upper() )
            ])
        return inp, outp

    @method(in_signature="", out_signature="aa{ss}")
    def iptables_get_stats(self):
        # Stuff returned by iptables-save -c:
        # #comment
        # *<module>
        # :<chain> POLICY [<pkgs>:<bytes>]
        # [44474:274509860] -A INPUT -i br0 -p tcp -m tcp --dport 3260 -m comment --comment "OPENATTIC:BR0:ISCSI:IN"
        # [23364:639510396] -A OUTPUT -o br0 -p tcp -m tcp --sport 3260 -m comment --comment "OPENATTIC:BR0:ISCSI:OUT"
        # COMMIT

        rgx = re.compile(
            r'^\[(?P<pkgs>\d+):(?P<bytes>\d+)\] -A (?P<chain>INPUT|OUTPUT)(?: -[io] (?P<iface>\w+\d*))? '
            r'-p (?P<proto>tcp|udp|all) -m (?:tcp|udp) --[ds]port (?P<portno>\d+) '
            r'-m comment --comment "(?P<comment>[^"]+)"$' )

        ret, out, err = invoke(["iptables-save", "-c"], log=False, return_out_err=True)

        res = []
        for line in out.split("\n"):
            line = line.strip()
            if not line or line[0] == '#':
                continue
            elif line[0] == '*':
                module = line[1:]
            elif line[0] == ':':
                continue
            elif line[0] == '[':
                # Rule
                m = rgx.match(line)
                if m:
                    lineinfo = m.groupdict()
                    if lineinfo["iface"] is None:
                        lineinfo["iface"] = ''
                    res.append( lineinfo )
            elif line == "COMMIT":
                continue

        return res
