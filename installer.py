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
from os.path  import join, dirname, abspath, exists
from optparse import OptionParser

PROJECT_ROOT = None

# Path auto-detection
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(dirname(abspath(__file__)))

# environment variables
sys.path.append( PROJECT_ROOT )
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from django.conf import settings


INSTALLERS = []

print "Detecting modules..."
for app in settings.INSTALLED_APPS:
    try:
        module = __import__( app+".installer" )
    except ImportError:
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


for module in INSTALLERS:
    try:
        register_options = getattr( getattr( module, "installer" ), "register_options" )
    except AttributeError:
        pass
    else:
        register_options(parser)

options, args = parser.parse_args()



for stage in ("init", "prerm", "rm", "postrm", "preinst", "inst", "postinst", "cleanup"):
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


