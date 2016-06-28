#!/usr/bin/env python
# -*- coding: utf-8 -*-

# *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
# *
# *  openATTIC is free software; you can redistribute it and/or modify it
# *  under the terms of the GNU General Public License as published by
# *  the Free Software Foundation; version 2.
# *
# *  This package is distributed in the hope that it will be useful,
# *  but WITHOUT ANY WARRANTY; without even the implied warranty of
# *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# *  GNU General Public License for more details.

import os
import glob
import sys
from make_dist import Process, VERBOSITY_VERBOSE

process = Process(verbosity=VERBOSITY_VERBOSE)

home_dir = os.path.expanduser('~')
build_deb_packages_py_path = os.path.join(os.path.dirname(sys.argv[0]), 'build_deb_packages.py')
tarballs = glob.glob(os.path.join(home_dir, 'src', '*.tar.bz2'))
for tarball in tarballs:
    process.run(['/usr/bin/python', build_deb_packages_py_path, tarball])
    print

