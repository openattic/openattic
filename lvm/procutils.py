# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import subprocess
from signal import signal, SIGTERM, SIGINT, SIG_DFL
from datetime import datetime
from select import select

from lvm.conf import settings as lvm_settings
from cmdlog.models import LogEntry

def invoke(args, close_fds=True, return_out_err=False, log=True):
    if log:
        log = LogEntry( starttime=datetime.now(), command=args[0][:250] )

    proc = subprocess.Popen(args,
        stdin  = None,
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        close_fds = close_fds
        )
    procout, procerr = proc.communicate()

    if log:
        out = [ "> " +  ' '.join(['"' + arg + '"' for arg in args])]
        out.extend([ "E " + line for line in procerr.split("\n") if line ])
        out.extend([ "O " + line for line in procout.split("\n") if line ])

        log.endtime  = datetime.now()
        log.exitcode = proc.returncode
        log.text     = '\n'.join(out)
        log.save()

        print log.text

    if return_out_err:
        return proc.returncode, procout, procerr
    return proc.returncode


def lvm_command(cmd):
    ret, out, err = invoke([cmd, "--noheadings", "--nameprefixes", "--unquoted", "--units", "m"], return_out_err=True, log=lvm_settings.LOG_COMMANDS)

    if err:
        raise SystemError(err)

    return [
        dict( [ vardef.split('=', 1) for vardef in line.split(" ") if vardef ] )
        for line in out.split("\n") if line.strip()
        ]

def lvm_vgs():
    return dict( [ (lv["LVM2_VG_NAME"], lv) for lv in lvm_command("/sbin/vgs") ] )

def lvm_lvs():
    return dict( [ (lv["LVM2_LV_NAME"], lv) for lv in lvm_command("/sbin/lvs") ] )

