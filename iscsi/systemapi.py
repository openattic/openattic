# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import re

from systemd import invoke, logged, LockingPlugin, method

from iscsi.models import Target, Lun
from iscsi.conf   import settings as iscsi_settings

@logged
class SystemD(LockingPlugin):
    dbus_path = "/iscsi"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        self.lock.acquire()
        try:
            ietd = open( iscsi_settings.IETD_CONF,     "w" )
            allw = open( iscsi_settings.INITR_ALLOW,   "w" )
            deny = open( iscsi_settings.INITR_DENY,    "w" )
            tgt  = open( iscsi_settings.TARGETS_ALLOW, "w" )

            try:
                for target in Target.objects.all():
                    ietd.write( "Target %s\n" % target.iscsiname )

                    for lun in target.lun_set.filter(state__in=("new", "update", "active")):
                        ietd.write( "\tLun %d Path=%s,Type=%s\n" % (lun.number, lun.volume.path, lun.ltype) )
                        if lun.alias:
                            ietd.write( "\tAlias %s\n" % lun.alias )

                    if target.init_allow.all().count():
                        allw.write( "%s %s\n" % ( target.iscsiname,
                            ', '.join([rec["address"] for rec in target.init_allow.values("address")])
                            ))

                    if target.init_deny.all().count():
                        deny.write( "%s %s\n" % ( target.iscsiname,
                            ', '.join([rec["address"] for rec in target.init_deny.values("address")])
                            ))
                    else:
                        deny.write( "%s ALL\n" % target.iscsiname )

                    if target.tgt_allow.all().count():
                        tgt.write( "%s %s\n" % ( target.iscsiname,
                            ', '.join([rec.address.split('/')[0] for rec in target.tgt_allow.all()])
                            ))
                    else:
                        tgt.write( "%s ALL\n" % target.iscsiname )

                    for chapuser in target.chapuser_set.all():
                        ietd.write( "\t%s %s %s\n" % (chapuser.usertype, chapuser.username, chapuser.passwd) )

            finally:
                ietd.close()
                allw.close()
                deny.close()
                tgt.close()
            #return invoke([iscsi_settings.INITSCRIPT, "restart"])
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="a{i(saa{sv})}")
    def get_volumes(self):
        fd = open("/proc/net/iet/volume", "rb")

        targets = {}
        current = None
        for line in fd:
            line = line.strip()
            values = dict([ part.split(':', 1) for part in line.split(' ') ])
            if "tid" in values:
                targets[int(values["tid"])] = (
                    values["name"],
                    []
                    )
                current = int(values["tid"])
            else:
                targets[current][1].append(values)

        return targets

    @method(in_signature="is", out_signature="i")
    def target_new(self, tid, name):
        return invoke(["/usr/sbin/ietadm", "--op", "new", "--tid", str(tid), "--params", "Name="+name])

    @method(in_signature="i", out_signature="i")
    def target_delete(self, tid):
        return invoke(["/usr/sbin/ietadm", "--op", "delete", "--tid", str(tid)])

    @method(in_signature="i", out_signature="a{si}")
    def target_show(self, tid):
        ret, out, err = invoke(["/usr/sbin/ietadm", "--op", "show", "--tid", str(tid)], return_out_err=True)
        return dict([ (a, int(b)) for (a, b) in [ part.strip().split('=', 1) for part in out.strip().split("\n") ]])

    @method(in_signature="isss", out_signature="i")
    def target_new_user(self, tid, usertype, username, password):
        return invoke(["/usr/sbin/ietadm", "--op", "new", "--tid", str(tid), "--user", "--params",
            "%s=%s,Password=%s" % ( usertype, username, password )
            ])

    @method(in_signature="iss", out_signature="i")
    def target_delete_user(self, tid, usertype, username):
        return invoke(["/usr/sbin/ietadm", "--op", "delete", "--tid", str(tid), "--user", "--params",
            "%s=%s" % ( usertype, username )
            ])

    @method(in_signature="ii", out_signature="i")
    def session_show(self, tid, sid):
        return invoke(["/usr/sbin/ietadm", "--op", "show", "--tid", str(tid), "--sid", str(sid)])

    @method(in_signature="iissi", out_signature="i")
    def lun_new(self, tid, lun, path, ltype, jid):
        cmd = ["/usr/sbin/ietadm", "--op", "new", "--tid", str(tid), "--lun", str(lun),
               "--params", "Path=%s,Type=%s" % (path, ltype)]
        if jid == -1:
            return invoke(cmd)
        else:
            self.job_add_command(jid, cmd)
            return -1

    @method(in_signature="iii", out_signature="i")
    def lun_delete(self, tid, lun, jid):
        cmd = ["/usr/sbin/ietadm", "--op", "delete", "--tid", str(tid), "--lun", str(lun)]
        if jid == -1:
            return invoke(cmd)
        else:
            self.job_add_command(jid, cmd)
            return -1

    @method(in_signature="iii", out_signature="i")
    def conn_delete(self, tid, sid, cid):
        return invoke(["/usr/sbin/ietadm", "--op", "delete", "--tid", str(tid), "--sid", str(sid), '--cid', str(cid)])

    @method(in_signature="", out_signature="i")
    def delete(self):
        return invoke(["/usr/sbin/ietadm", "--op", "delete"])

    @method(in_signature="ia{ss}", out_signature="i")
    def target_update(self, tid, params):
        return invoke(["/usr/sbin/ietadm", "--op", "update", "--tid", str(tid),
                "--params", ','.join([ "%s=%s" % (key, params[key]) for key in params ]) ])

    @method(in_signature="is", out_signature="i")
    def target_redirect(self, tid, destination):
        return invoke(["/usr/sbin/ietadm", "--op", "update", "--tid", str(tid), "--redirect", destination])

    @method(in_signature="iss", out_signature="i")
    def target_add_incoming_user(self, tid, username, password):
        return invoke(["/usr/sbin/ietadm", "--op", "new", "--tid", str(tid), "--user", "--params",
                        "IncomingUser=%s,Password=%s" % ( username, password ) ])

    @method(in_signature="iss", out_signature="i")
    def target_add_outgoing_user(self, tid, username, password):
        return invoke(["/usr/sbin/ietadm", "--op", "new", "--tid", str(tid), "--user", "--params",
                        "OutgoingUser=%s,Password=%s" % ( username, password ) ])

    @method(in_signature="", out_signature="s")
    def version(self):
        ret, out, err = invoke(["/usr/sbin/ietadm", "--version"], return_out_err=True)
        return out.strip().split(' ')[2]
