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

import os
import logging
import threading
import subprocess

from time import sleep
from datetime import datetime
from select import select

from cmdlog.models import LogEntry

def invoke(args, close_fds=True, return_out_err=False, log=True, stdin=None, fail_on_err=True):
    """ Invoke a subprocess with the given args and log the output.

        Parameters:

        * close_fds=True       -- If False, file descriptors will not be closed for the child process.
        * return_out_err=False -- If True, stdout and stderr of the child will be returned.
        * log=True             -- If False, the command's execution will not be logged.
        * stdin=None           -- Any string given will be sent to the child's stdin.
        * fail_on_err=True     -- If the child's exit code is not zero, raise SystemError.

        Returns the exit code if return_out_err is False, and a tuple of (exit code, stdout, stderr) otherwise.
    """
    starttime=datetime.now()

    procenv = os.environ.copy()
    procenv["LANG"] = procenv["LANGUAGE"] = procenv["LC_ALL"] = "en_US.UTF-8"

    proc = subprocess.Popen( [arg.encode("UTF-8") if isinstance(arg, unicode) else arg for arg in args],
        stdin  = (None if stdin is None else subprocess.PIPE),
        stdout = subprocess.PIPE,
        stderr = subprocess.PIPE,
        close_fds = close_fds,
        env = procenv
        )

    procout = ""
    procerr = ""

    cmdline = ' '.join(['"' + arg + '"' for arg in args])
    out = [ "> " + cmdline ]

    if stdin is not None:
        proc.stdin.write(stdin)
        proc.stdin.close()

    process_alive = True
    last_data_has_been_read = False
    while process_alive or not last_data_has_been_read:
        rdy_read, rdy_write, rdy_other = select([proc.stdout, proc.stderr], [], [], 0.1)
        if proc.stdout in rdy_read:
            data = proc.stdout.read()
            procout += data
            out.extend([ "O " + line for line in data.split("\n") if line ])
        if proc.stderr in rdy_read:
            data = proc.stderr.read()
            procerr += data
            out.extend([ "E " + line for line in data.split("\n") if line ])
        if proc.poll() is not None:
            if process_alive:
                proc.wait()
                process_alive = False
            else:
                last_data_has_been_read = True

    proc.stdout.close()
    proc.stderr.close()

    if log or proc.returncode != 0:
        logent = LogEntry( starttime=starttime, command=args[0][:250] )
        logent.endtime  = datetime.now()
        logent.exitcode = proc.returncode
        logent.text     = '\n'.join(out)
        logent.save()

        if proc.returncode == 0:
            logging.debug(logent.text)
        else:
            logging.error(logent.text)

    if fail_on_err and proc.returncode != 0:
        raise SystemError("%s failed: %s" % (cmdline, procerr))

    if return_out_err:
        return proc.returncode, procout, procerr
    return proc.returncode


def run_queue(q, signal=None, sigargs=None):
    for cmd in q:
        invoke(cmd)
        sleep(0.1)
    if signal is not None:
        signal(*sigargs)

def create_job(commands, signal=None, sigargs=None):
    proc = threading.Thread(target=run_queue, args=(commands, signal, sigargs))
    proc.start()
    return True
