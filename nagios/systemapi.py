# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import re
from django.template.loader import render_to_string

from systemd       import invoke, logged, LockingPlugin, method, create_job
from nagios.models import Command, Service

@logged
class SystemD(LockingPlugin):
    dbus_path = "/nagios"

    @method(in_signature="", out_signature="")
    def write_services(self):
        self.lock.acquire()
        try:
            fd = open( "/etc/nagios3/conf.d/openattic.cfg", "wb" )
            try:
                fd.write( render_to_string( "nagios/services.cfg", {
                    "Commands": Command.objects.all(),
                    "Services": Service.objects.filter(query_only=False),
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

    @method(in_signature="ssis", out_signature="ii")
    def iptables_install_rules(self, device, socketproto, portno, protocolname):
        inp = invoke([
            "iptables", "-I", "INPUT", "-p", socketproto,
            "-i", device, "--dport", portno, "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:IN" % ( device.upper(), protocolname.upper() )
            ])
        outp = invoke([
            "iptables", "-I", "OUTPUT", "-p", socketproto,
            "-o", device, "--sport", portno, "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:OUT" % ( device.upper(), protocolname.upper() )
            ])
        return inp, outp

    @method(in_signature="ssis", out_signature="ii")
    def iptables_remove_rules(self, device, socketproto, portno, protocolname):
        inp = invoke([
            "iptables", "-D", "INPUT", "-p", socketproto,
            "-i", device, "--dport", portno, "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:IN" % ( device.upper(), protocolname.upper() )
            ])
        outp = invoke([
            "iptables", "-D", "OUTPUT", "-p", socketproto,
            "-o", device, "--sport", portno, "-m", "comment",
            "--comment", "OPENATTIC:%s:%s:OUT" % ( device.upper(), protocolname.upper() )
            ])
        return inp, outp

    @method(in_signature="", out_signature="aa{ss}")
    def iptables_get_stats(self):
        # Stuff returned by iptables-save -c:
        # #comment
        # *<module>
        # :<chain> POLICY [<pkgs>:<bytes>]
        # [24044474:51274509860] -A INPUT -i br0 -p tcp -m tcp --dport 3260 -m comment --comment "OPENATTIC:BR0:ISCSI:IN"
        # [14523364:19639510396] -A OUTPUT -o br0 -p tcp -m tcp --sport 3260 -m comment --comment "OPENATTIC:BR0:ISCSI:OUT"
        # COMMIT

        rgx = re.compile(
            r'^\[(?P<pkgs>\d+):(?P<bytes>\d+)\] -A (?P<chain>INPUT|OUTPUT)(?: -[io] (?P<iface>\w+\d*))? -p (?P<proto>tcp|udp|all) '
            r'-m (?:tcp|udp) --[ds]port (?P<portno>\d+) -m comment --comment "(?P<comment>[^"]+)"$' )

        ret, out, err = invoke(["iptables-save", "-c"], log=False, return_out_err=True)

        res = []
        for line in out.split("\n"):
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
                    print lineinfo
            elif line == "COMMIT":
                continue

        return res
