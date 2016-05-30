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
import tempfile
from make_dist import Process, VERBOSITY_VERBOSE

process = Process(verbosity=VERBOSITY_VERBOSE)


class Test(object):

    __abs_script_path = None

    @staticmethod
    def get_abs_script_path():
        if not Test.__abs_script_path:
            script_path = os.path.dirname(os.path.abspath(__file__))
            # utils_path = os.path.split(script_path)[0]
            Test.__abs_script_path = os.path.join(script_path, 'make_dist.py')
        return Test.__abs_script_path

    @staticmethod
    def extract(path):
        tmpdir = tempfile.gettempdir()
        process.run(['tar', 'xf', path, '-C', tmpdir])
        basename = os.path.splitext(os.path.splitext(os.path.basename(os.path.normpath(path)))[0])[0]
        return os.path.join(tmpdir, basename)


arguments = [
    'create stable',
    'create stable --revision=v2.0.7-1',
    'create stable --source=/srv/openattic',
    'create unstable',
    'create unstable --revision=v2.0.7-1',
]

for argument in arguments:
    result = process.run(['/usr/bin/python', Test.get_abs_script_path()] + argument.split(' '))
    last_line = result.stdout.strip().split('\n')[-1]
    tarball_path = last_line.split(' ')[-1].strip()

    tempdir = Test.extract(tarball_path)
    with open(os.path.join(tempdir, 'version.txt'), 'r') as fh:
        print(''.join(fh.readlines()))
