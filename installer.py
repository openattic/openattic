# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

for app in settings.INSTALLED_APPS:
    try:
        module = __import__( app+".installer" )
    except ImportError:
        print "App '%s' doesn't seem to have an installer, skipping" % app
    else:
        try:
            installer = getattr( getattr( module, "installer" ), "run" )
        except AttributeError:
            print "Installer of app '%s' doesn't seem to export a run() function, skipping" % app
        else:
            print "Running Installer for app '%s'" % app
            installer()
