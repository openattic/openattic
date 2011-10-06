# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import logging
import threading
import subprocess

from datetime import datetime

from cmdlog.models import LogEntry

def invoke(args, close_fds=True, return_out_err=False, log=True, stdin=None, fail_on_err=True):
    """ Invoke a subprocess with the given args and log the output. """
    if log:
        log = LogEntry( starttime=datetime.now(), command=args[0][:250] )

    proc = subprocess.Popen(args,
        stdin  = (None if stdin is None else subprocess.PIPE),
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        close_fds = close_fds
        )
    procout, procerr = proc.communicate(stdin)

    cmdline = ' '.join(['"' + arg + '"' for arg in args])

    if log:
        out = [ "> " + cmdline ]
        out.extend([ "E " + line for line in procerr.split("\n") if line ])
        out.extend([ "O " + line for line in procout.split("\n") if line ])

        log.endtime  = datetime.now()
        log.exitcode = proc.returncode
        log.text     = '\n'.join(out)
        log.save()

        if log.exitcode == 0:
            logging.debug(log.text)
        else:
            logging.error(log.text)

    if fail_on_err and proc.returncode != 0:
        raise SystemError("%s failed: %s" % (cmdline, procerr))

    if return_out_err:
        return proc.returncode, procout, procerr
    return proc.returncode


def run_queue(q, signal=None, sigargs=None):
    for cmd in q:
        invoke(cmd)
    if signal is not None:
        signal(*sigargs)

def create_job(commands, signal=None, sigargs=None):
    proc = threading.Thread(target=run_queue, args=(commands, signal, sigargs))
    proc.start()
    return True
