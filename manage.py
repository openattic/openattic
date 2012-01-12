#!/usr/bin/env python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.core.management import execute_manager

try:
    import settings # Assumed to be in the same directory.
except ImportError:
    import sys
    sys.stderr.write("Error: Can't find the file 'settings.py' in the directory containing %r. It appears you've customized things.\nYou'll have to run django-admin.py, passing it your settings module.\n(If the file settings.py does indeed exist, it's causing an ImportError somehow.)\n" % __file__)
    sys.exit(1)


if __name__ == "__main__":
    import os, sys
    if "OACONFIG" in os.environ and os.environ["OACONFIG"] == "True":
        sys.argv[0] = "oaconfig"

    execute_manager(settings)
