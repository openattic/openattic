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

"""Usage:
    test_make_dist.py [--oa-dir=<oa_dir>]

Options:
    --oa-dir=<oa_dir>  The directory to be used for the test creation of the tarball
                       [default: /srv/openattic].

"""
import os
import tempfile
import docopt
from make_dist import Process, VERBOSITY_VERBOSE

process = Process(verbosity=VERBOSITY_VERBOSE)
args = docopt.docopt(__doc__)
args['--oa-dir'] = os.path.abspath(args['--oa-dir'])


def get_abs_script_path():
    script_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(script_path, 'make_dist.py')


def extract_tar(tarball):
    tmpdir = tempfile.gettempdir()
    process.run(['tar', 'xf', tarball, '-C', tmpdir])
    normalized_path = os.path.normpath(tarball)
    basename = os.path.splitext(os.path.splitext(os.path.basename(normalized_path))[0])[0]
    return os.path.join(tmpdir, basename)


def test(arguments):
    for elem in arguments:
        argument, hint = elem
        if hint:
            print('Hint: {}'.format(hint))
        result = process.run(['/usr/bin/python', get_abs_script_path()] + argument.split(' '))
        last_line = result.stdout.strip().split('\n')[-1]
        tarball_path = last_line.split(' ')[-1].strip()
        tempdir = extract_tar(tarball_path)
        with open(os.path.join(tempdir, 'version.txt'), 'r') as fh:
            print(''.join(fh.readlines()))

arguments = [
    ('create release', 'The revision is supposed to be the latest existing tag, not the tip!'),
    ('create release --revision=v2.0.7-1', ''),
    ('create release --revision=default', ''),
    ('create release --revision=development', ''),
    ('create release --source={}'.format(args['--oa-dir']), ''),
    ('create snapshot', ''),
    ('create snapshot --revision=v2.0.7-1', ''),
    ('create snapshot --revision=default', ''),
    ('create snapshot --revision=development', ''),
    ('create snapshot --source={}'.format(args['--oa-dir']), ''),
]

test(arguments)
