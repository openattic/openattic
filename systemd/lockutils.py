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

import os
import errno
import time
import stat
import fcntl
import logging

class AlreadyLocked(Exception):
    pass

def acquire_lock(lockfile, max_wait=600):
    """ Acquire a lock file.

        Raises AlreadyLocked if the timeout expires.

        Returns a tuple of (file path, file descriptor) to be passed into release_lock.
    """

    # http://www.velocityreviews.com/forums/t359733-how-to-lock-files-the-easiest-best-way.html

    while True:
        try:
            fd = os.open(lockfile, os.O_RDWR | os.O_CREAT | os.O_EXCL)
            # we created the lockfile, so we're the owner
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            break

        except OSError, e:
            if e.errno != errno.EEXIST:
                # should not occur
                raise

            try:
                # the lock file exists.
                # * try to stat it to get its age and read its contents to report the owner PID.
                # * try to flock it to see if the process that created it is still around.
                s  = os.stat(lockfile)
                fd = os.open(lockfile, os.O_RDWR)
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except IOError, e:
                # flock failed, so the process is indeed still around. check the
                # timeout and retry.
                pass
            except OSError, e:
                if e.errno != errno.ENOENT:
                    logging.error("%s exists but stat() failed: %s" %
                            (lockfile, e.strerror))
                    raise
                # we didn't create the lockfile, so it did exist, but it's
                # gone now. Just try again
                continue
            else:
                # we didn't create the lockfile, but flock() worked, so the
                # process that DID create it died in the meantime.
                # this means we have the lock now.
                break

            # we didn't create the lockfile and it's still there, check its age
            now = int(time.time())
            if now - s[stat.ST_MTIME] > max_wait:
                f = os.fdopen(fd, "r")
                try:
                    pid = f.readline()
                    logging.error("%s has been locked for more than "
                            "%d seconds (PID %s)" % (lockfile, max_wait, pid))
                    raise AlreadyLocked("timeout waiting for lockfile '%s'" % lockfile)
                finally:
                    f.close()

            # it has not been locked for too long, wait a while and retry
            time.sleep(1)

    # if we get here. we have the lockfile. Convert the os.open file
    # descriptor into a Python file object and record our PID in it
    f = os.fdopen(fd, "w")
    f.write("%d\n" % os.getpid())
    f.flush()

    return (lockfile, f)

def release_lock(locktuple):
    """ Release a lock acquired by acquire_lock. """
    lockfile, f = locktuple
    f.close()
    os.unlink(lockfile)


class Lockfile(object):
    """ Makes sure a lockfile is acquired for a critical section and
        released when that section is left.

        Usage:

            with Lockfile("/var/lock/lockfile"):
                <critical section>

    """
    def __init__(self, lockfile, max_wait=600):
        self.max_wait = max_wait
        self.lockfile = lockfile
        self.lock = None

    def __enter__(self):
        self.lock = acquire_lock(self.lockfile, self.max_wait)

    def __exit__(self, type, value, traceback):
        release_lock(self.lock)


