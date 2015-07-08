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

import re
import email
import smtplib
import socket
import os.path

from time import time, sleep
from hashlib import md5

from django.template.loader import render_to_string
from django.contrib.auth.models import User
from django.conf   import settings

from ifconfig.models import Host
from systemd.procutils import invoke, service_command
from systemd.plugins   import logged, BasePlugin, method, deferredmethod
from nagios.models import Command, Service
from nagios.conf   import settings as nagios_settings
from nagios.graphbuilder import Graph as GraphBuilder, parse

@logged
class SystemD(BasePlugin):
    dbus_path = "/nagios"

    @deferredmethod(in_signature="", once_last=True)
    def writeconf(self, sender):
        # Services
        fd = open( nagios_settings.SERVICES_CFG_PATH, "wb" )
        try:
            fd.write( render_to_string( "nagios/services.cfg", {
                "IncludeHost": nagios_settings.INCLUDE_HOST_IN_CFG,
                "Host":     Host.objects.get_current(),
                "Commands": Command.objects.all(),
                "Services": Service.objects.filter(command__query_only=False)
                } ) )
        finally:
            fd.close()
        # Contacts
        fd = open( nagios_settings.CONTACTS_CFG_PATH, "wb" )
        try:
            fd.write( render_to_string( "nagios/contacts.cfg", {
                "Admins": User.objects.filter(is_active=True, is_superuser=True).exclude(email=""),
                } ) )
        finally:
            fd.close()
        invoke([nagios_settings.BINARY_NAME, "--verify-config", nagios_settings.NAGIOS_CFG_PATH])
        # Sometimes, reloading Nagios can cause it to not come up due to some strange errors that
        # may or may not be fixed simply through retrying.
        end = time() + 20
        command = "reload"
        while time() < end:
            service_command(nagios_settings.SERVICE_NAME, command)
            command = "restart" # only try reload the first time, then restart
            retry = time() + 5
            while not os.path.exists(nagios_settings.STATUS_DAT_PATH) and time() < retry:
                sleep(0.1)

    @method(in_signature="", out_signature="i")
    def check_conf(self):
        return invoke([nagios_settings.BINARY_NAME, "--verify-config", nagios_settings.NAGIOS_CFG_PATH])

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

    @method(in_signature="a{ss}", out_signature="")
    def notify(self, checkdata):
        user  = User.objects.get(username=checkdata["CONTACTNAME"])
        serv  = Service.objects.get(description=checkdata["SERVICEDESC"])

        alt  = email.mime.Multipart.MIMEMultipart("alternative")

        mp = email.mime.Multipart.MIMEMultipart("related")
        mp["From"] = "openattic@" + socket.getfqdn()
        mp["To"]   = user.email
        mp["Subject"] = "%s changed state to %s" % (serv.description, checkdata["SERVICESTATE"].lower())
        mp.attach(alt)

        graphs = [{"srcline": dbgraph.fields, "title": dbgraph.title, "verttitle": dbgraph.verttitle} for dbgraph in serv.command.graph_set.all()]
        if not graphs:
            graphs = [ { "srcline": k, "title": v, "verttitle": None } for (k, v) in serv.rrd.source_labels.items() ]

        for graph in graphs:
            builder = GraphBuilder()
            builder.bgcol  = "FFFFFF"
            builder.fgcol  = "111111"
            builder.grcol  = ""
            builder.sacol  = "FFFFFF"
            builder.sbcol  = "FFFFFF"
            builder.bgimage = nagios_settings.GRAPH_BGIMAGE
            builder.title  = serv.description
            builder.verttitle = graph["verttitle"]

            graph["id"]    = md5(graph["srcline"]).hexdigest()
            graph["avail"] = True

            for src in parse(graph["srcline"]):
                try:
                    builder.add_source( src.get_value(serv.rrd) )
                except KeyError:
                    graph["avail"] = False

            if graph["avail"]:
                img  = email.mime.Image.MIMEImage(builder.get_image())
                img.add_header("Content-ID", "<%s>" % graph["id"])
                mp.attach(img)

        checkdata["graphs"] = graphs

        alt.attach(email.mime.Text.MIMEText(render_to_string( "nagios/notify.txt",  checkdata ), "plain", "utf-8"))
        alt.attach(email.mime.Text.MIMEText(render_to_string( "nagios/notify.html", checkdata ), "html",  "utf-8"))

        conn = smtplib.SMTP(settings.EMAIL_HOST)
        conn.sendmail(mp["From"], [mp["To"]], mp.as_string())
        conn.quit()

