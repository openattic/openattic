#!/usr/bin/env python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

""" Updates the system configuration according to the settings.
 *
 *  For each app configured in settings.INSTALLED_APPS, it tries to
 *  import the installer submodule, and then calls a set of hooks
 *  from those modules.
 *
 *  Existing hooks will be called in the following order:
 *
 *  register_options(parser):
 *    Called before parsing the command line. Allows the installers
 *    to register further options. Options and positional args will
 *    then be passed back to the other hooks via the `options` and
 *    `args` parameters.
 *
 *  init(options, args):
 *    Initial stage.
 *
 *  prerm(options, args):
 *    Called before the LVM module removes LVs.
 *
 *  rm(options, args):
 *    Used by the LVM module to remove LVs.
 *
 *  postrm(options, args):
 *    Called after the LVM module removed LVs.
 *
 *  preinst(options, args):
 *    Called before the LVM module installs new LVs.
 *
 *  inst(options, args):
 *    Used by the LVM module to remove LVs.
 *
 *  postinst(options, args):
 *    Called after the LVM module installed new LVs.
 *
 *  cleanup(options, args):
 *    Final stage.
 *
 *  The modules will be called in the order in which they are listed
 *  in settings.INSTALLED_APPS.
 *
"""

import os, sys
import errno
import time
import stat
from os.path  import join, dirname, abspath, exists
from optparse import OptionParser

PROJECT_ROOT = None

# Path auto-detection
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(abspath(__file__))

# environment variables
sys.path.append( PROJECT_ROOT )
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'


# LOCKFILE
# http://www.velocityreviews.com/forums/t359733-how-to-lock-files-the-easiest-best-way.html

# the maximum reasonable time for a process to be
max_wait = 5*60
lockfile = join(PROJECT_ROOT, ".installer.lock")

while True:
    try:
        fd = os.open(lockfile, os.O_EXCL | os.O_RDWR | os.O_CREAT)
        # we created the lockfile, so we're the owner
        break

    except OSError, e:
        if e.errno != errno.EEXIST:
            # should not occur
            raise

        try:
            # the lock file exists, try to stat it to get its age
            # and read it's contents to report the owner PID
            f = open(lockfile, "r")
            s = os.stat(lockfile)
        except OSError, e:
            if e.errno != errno.ENOENT:
                sys.exit("%s exists but stat() failed: %s" %
                         (lockfile, e.strerror))
            # we didn't create the lockfile, so it did exist, but it's
            # gone now. Just try again
            continue

        # we didn't create the lockfile and it's still there, check
        # its age
        now = int(time.time())
        if now - s[stat.ST_MTIME] > max_wait:
            pid = f.readline()
            sys.exit("%s has been locked for more than " \
                     "%d seconds (PID %s)" % (lockfile, max_wait,
                     pid))

        # it's not been locked too long, wait a while and retry
        f.close()
        time.sleep(1)

# if we get here. we have the lockfile. Convert the os.open file
# descriptor into a Python file object and record our PID in it

f = os.fdopen(fd, "w")
f.write("%d\n" % os.getpid())
f.close()


# RUN INSTALLER

from django.conf import settings


INSTALLERS = []

print "Detecting modules..."
for app in settings.INSTALLED_APPS:
    try:
        module = __import__( app+".installer" )
    except ImportError, err:
        pass
    else:
        INSTALLERS.append(module)


parser = OptionParser()

parser.add_option( "-v", "--verbose",
    help="Verbose output of messages.",
    action="store_true", default=False
    )

parser.add_option( "-c", "--confupdate",
    help="Update config files, regardless of Volume states.",
    action="store_true", default=False
    )

parser.add_option( "-o", "--only-module",
    help="Ignore detected modules and only call the stages of the given module.",
    )

for module in INSTALLERS:
    try:
        register_options = getattr( getattr( module, "installer" ), "register_options" )
    except AttributeError:
        pass
    else:
        register_options(parser)

options, args = parser.parse_args()

if options.only_module:
    try:
        module = __import__( options.only_module+".installer" )
    except ImportError, err:
        sys.exit(err)
    else:
        INSTALLERS = [module]


for stage in (
        "init",
        "prerm",     "rm",     "postrm",
        "preinst",   "inst",   "postinst",
        "cleanup"):
    print ("%-10s" % stage),
    for module in INSTALLERS:
        try:
            installer = getattr( getattr( module, "installer" ), stage )
        except AttributeError:
            print (" %-8s " % module.__name__),
        else:
            print ("%-10s" % ("["+module.__name__+"]")),
            installer(options, args)
    print


os.unlink(lockfile)

