#!/usr/bin/env python
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

import os, sys
from django.core.management import execute_manager

try:
    import settings # Assumed to be in the same directory.
except ImportError:
    sys.stderr.write("Error: Can't find the file 'settings.py' in the directory containing %r. "
        "It appears you've customized things.\nYou'll have to run django-admin.py, passing it your "
        "settings module.\n(If the file settings.py does indeed exist, it's causing an "
        "ImportError somehow.)\n" % __file__)
    sys.exit(1)


if __name__ == "__main__":
    if "OACONFIG" in os.environ and os.environ["OACONFIG"] == "True":
        sys.argv[0] = "oaconfig"

    execute_manager(settings)
