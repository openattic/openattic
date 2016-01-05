# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
import os.path
import pwd
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

    # The following is based on this thread:
    # http://www.velocityreviews.com/forums/t359733-how-to-lock-files-the-easiest-best-way.html
    # Sadly, this code cannot cope with situations in which the lockfile exists, but there
    # is no process using it. This situation arises when the owner process does not get around
    # to actually unlink()ing the lockfile, e.g. due to a crash, the node being STONITHED,
    # malicious sysadmins testing their cluster or other dubious reasons that I can't think of
    # right now.
    # For this, we require locks that are bound to file descriptors, so they disappear together
    # with the process owning the locks.
    #
    # This mechanism works in two stages:
    # 1. Get a file descriptor on the lockfile, making sure we don't accidentally replace the
    #    file in the process or we couldn't be sure that flock() uses the very same file that
    #    other processes use for locking.
    # 2. flock() the file to tell other processes that there is someone alive using the file.

    if not os.path.exists("/var/lock/openattic"):
        os.mkdir("/var/lock/openattic", 0755)
        if os.getuid() == 0:
            openattic = pwd.getpwnam("openattic")
            os.chown("/var/lock/openattic", openattic.pw_uid, openattic.pw_gid)

    created = None

    while True:
        # Stage 1: Get a file descriptor.
        try:
            # try to create the lockfile and stat it so that stat info is
            # available in case the flock() fails later on.
            fd = os.open(lockfile, os.O_RDWR | os.O_CREAT | os.O_EXCL)
            # stat should not fail because we just created the file, and only
            # processes that own the lock would unlink() it, but there is no
            # such process or else the create would have failed.
            s  = os.stat(lockfile)
            created = True

        except OSError, e:
            if e.errno != errno.EEXIST:
                raise

            created = False

            try:
                # the lock file exists.
                # try to stat it to get its age and open it for later reading.
                # the open() call comes second so that when the file disappears
                # in the meantime, we don't have a maybe-file-descriptor laying
                # around.
                s  = os.stat(lockfile)
                fd = os.open(lockfile, os.O_RDWR)
            except OSError, e:
                if e.errno != errno.ENOENT:
                    logging.error("%s exists but stat() failed: %s" %
                            (lockfile, e.strerror))
                    raise
                # We didn't create the lockfile, so it did exist, but it's
                # gone now. Just try again.
                continue

        # If we reach this line, we have a valid file descriptor in `fd`, so even
        # if the owner process decides to unlink() the lock file, we'll still be
        # able to access it and read from it.
        #
        # Stage 2: flock() it.

        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            # we flock()ed the file, so we're the owner.
            break

        except IOError, e:
            if e.errno != errno.EWOULDBLOCK:
                raise

            # we didn't flock() the lockfile, so check its age
            # we need to fdopen() the lockfile outside of the if: clause so it gets
            # closed properly in all the cases. Otherwise we would leak file descriptors.
            f = os.fdopen(fd, "r")
            try:
                now = int(time.time())
                if now - s[stat.ST_MTIME] >= max_wait:
                    # read lockfile contents to report the owner PID.
                    pid = f.readline().strip()
                    logging.error("%s has been locked for more than "
                            "%d seconds (PID %s)" % (lockfile, max_wait, pid))
                    raise AlreadyLocked("timeout waiting for lockfile '%s'" % lockfile)
            finally:
                f.close()

            # it has not been locked for too long, wait a while and retry
            time.sleep(1)

    ##############################################
    #               WARNING                      #
    #                                            #
    # YOU ARE NOW ENTERING THE CRITICAL SECTION. #
    # TRESPASSERS WILL BE `kill -9`ed ON SIGHT.  #
    ##############################################

    # if we get here. we have the lockfile. Convert the os.open file
    # descriptor into a Python file object and record our PID in it
    f = os.fdopen(fd, "w")
    f.write("%d\n" % os.getpid())
    f.flush()

    # make sure the openattic user can access the lockfile
    if os.getuid() == 0:
        openattic = pwd.getpwnam("openattic")
        os.chown(lockfile, openattic.pw_uid, openattic.pw_gid)

    return (lockfile, f, created)

def release_lock(locktuple):
    """ Release a lock acquired by acquire_lock. """
    lockfile, f, created = locktuple
    # the lock consists of a flock()ed file which we want to unlink so as not to leave
    # any stale lockfiles lying around.
    # we need to unlink the file whilst holding the lock, because otherwise another
    # process might acquire it before we get to delete it, and when we finally do,
    # we'd break their lock.
    # If we unlink first, the flock will then point to a file descriptor that is no
    # longer available to other processes, so it doesn't matter when we get around
    # to closing the fd.
    # However, we may only safely unlink the file if we created it ourselves, because
    # otherwise we might destroy another process's lockfile that they didn't get to
    # flock() yet.
    if created:
        os.unlink(lockfile)
    ##############################################
    # YOU ARE NOW LEAVING THE CRITICAL SECTION.  #
    # THANK YOU FOR VISITING.                    #
    ##############################################
    f.close()


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


