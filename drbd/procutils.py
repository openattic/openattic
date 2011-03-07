# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import subprocess

def drbd_command(cmd, res):
    if os.getuid() == 0:
        args = []
    else:
        args = ["sudo"]

    args.extend(["/sbin/drbdadm", cmd, res])

    proc = subprocess.Popen(args,
        stdin = None, stdout = subprocess.PIPE, stderr = subprocess.PIPE, close_fds = True
        )
    out, err = proc.communicate()

    if err:
        raise SystemError(err)

    return out.strip()

def drbd_cstate(res):
    return drbd_command("cstate", res)

def drbd_dstate(res):
    return drbd_command("dstate", res)

def drbd_role(res):
    return drbd_command("role", res)
