# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import subprocess
from signal import signal, SIGTERM, SIGINT, SIG_DFL

def invoke(args):
    print args
    proc = subprocess.Popen(args,
        stdin  = sys.stdin,
        stdout = sys.stdout,
        stderr = sys.stderr
        )

    def fwdsigterm(signum, frame):
        proc.send_signal(SIGTERM)
        signal(SIGTERM, fwdsigterm)

    signal(SIGTERM, fwdsigterm)
    signal(SIGINT, fwdsigterm)
    proc.wait()
    signal(SIGTERM, SIG_DFL)
    signal(SIGINT, SIG_DFL)

    return proc.returncode


def lvm_command(cmd):
    if os.getuid() == 0:
        args = []
    else:
        args = ["sudo"]

    args.extend([cmd, "--noheadings", "--nameprefixes", "--unquoted", "--units", "m"])

    proc = subprocess.Popen(args,
        stdin = None, stdout = subprocess.PIPE, stderr = subprocess.PIPE, close_fds = True
        )
    out, err = proc.communicate()

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

