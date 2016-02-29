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
    build_deb_packages.py <tarball> [<release_channel>] [--publish=<repo_dir>]

Create a deb package out of a tarball. The release channel is automatically determined, based on the
file name of the tarball.

Arguments:
    <tarball>           The path to the tarball file. Use "-" as path to read it from stdin.
    <release_channel>   'stable' or 'nightly'. Skips automatic detection of the release channel.

Options:
    --publish=<repo_dir>    Publish the created debian files using `reprepro`. Does also remove the
                            nightly packages if the release channel is `nightly`.
                            <repo_dir> is the directory of the repository to publish the built
                            packages to.

More sophisticated example:
    ./make_dist.py create stable -s | ./build_deb_packages.py -
"""

import os
import sys
import re
import unittest
import shutil
import docopt
from make_dist import Process, ProcessResult
from ConfigParser import SafeConfigParser
from datetime import datetime


class UnknownReleaseChannelError(Exception):
    pass


class FileNotFoundError(Exception):
    pass


class ArgumentError(Exception):
    pass


class ParsingError(Exception):
    pass


class DebPackageBuilder(object):
    def __init__(self, args):
        self._process = Process()
        self._datetime = datetime.utcnow().strftime('%Y%m%d%H%M')
        self._args = args

    @staticmethod
    def detect_release_with_filename(tarball_filename):
        stable_re = r'\w+[_-]\d+\.\d+(\.\d+)?[\w+\.]+'
        unstable_re = r'\w+[_-]\d+\.\d+\.\d+(\.\d+)?\~\d{12}[\w+\.]+'

        if not tarball_filename or not isinstance(tarball_filename, str):
            raise ArgumentError

        tarball_filename = os.path.basename(tarball_filename)

        # Test for unstable first, because the re it more exact.
        if re.match(unstable_re, tarball_filename):
            return 'nightly'
        if re.match(stable_re, tarball_filename):
            return 'stable'

        raise ParsingError

    @staticmethod
    def determine_dirname_by_filename(fname):
        """Determine the directory name of the tarball using the file name of the tarball."""
        if not fname or not isinstance(fname, str):
            raise ArgumentError

        fname = os.path.basename(fname)

        regex = r'\.tar\.(bz2|gz|lxma|xz)$'
        if re.search(regex, fname):
            fname = re.sub(regex, '', fname)
        else:
            raise ParsingError

        fname = re.sub(r'\.orig$', '', fname)

        return fname

    @staticmethod
    def determine_deb_tarball_filename(filepath):
        """Determines the deb tarball filename for debian."""
        basename = os.path.basename(filepath)
        regex = r'^(\w+)[-_](\d+\.\d+\.\d+(\.\d+)?)[\w~-]*(\.tar\.(bz2|gz|lxma|xz))$'

        match = re.search(regex, basename)
        if match:
            filename = match.group(1) + '_' + match.group(2) + '.orig' + match.group(4)
            return filename

        raise ParsingError

    @staticmethod
    def extract_version(name):
        if name:
            match = re.search(r'.*?([\d\.]+)~?(\d+)?.*\.tar.*', name)
            if match:
                return (match.group(1), match.group(2))

        raise ParsingError

    def _publish_packages(self, pkgdir, release_channel, version, changes_filename):
        """Publish a package using the `reprepro` command."""

        small_version = version[0]
        if version[1]:
            small_version += '~' + version[1]
        control_file = os.path.join(pkgdir, 'openattic-' + small_version, 'debian', 'control')
        obsolete_packages = []
        with open(control_file) as fcontrol:
            for line in fcontrol:
                match = re.search(r'^Package: (.*)\s*', line)
                if match:
                    obsolete_packages.append(match.group(1))

        # Remove deprecated nightly packages.
        if release_channel == 'nightly':
            cmd = ['reprepro', '--basedir', self._args['--publish'], 'remove', release_channel]
            cmd += obsolete_packages

            self._process.run(cmd)

        # Publish packages.
        cmd = ['reprepro', '--basedir', self._args['--publish'], 'include', release_channel,
               changes_filename]
        self._process.run(cmd, cwd=pkgdir)

    def build(self, release_channel, tarball_file_path):
        """Build the debian packages.

        release_channel -- Either 'stable' or 'nightly'.
        tarball_file_path -- The path of the tarball.
        """

        if release_channel not in ('stable', 'nightly'):
            raise UnknownReleaseChannelError()

        build_dir = os.path.join(os.environ['HOME'], 'src', 'deb_builds')

        if os.path.isdir(build_dir):
            shutil.rmtree(build_dir)
        os.makedirs(build_dir)

        if not os.path.isfile(tarball_file_path):
            raise FileNotFoundError()

        source_dir = os.path.join(build_dir, self.determine_dirname_by_filename(tarball_file_path))
        if os.path.isdir(source_dir):
            shutil.rmtree(source_dir)

        # Extract the tarball.
        shutil.copy(tarball_file_path, build_dir)
        new_tarball_file_path = os.path.join(build_dir, os.path.basename(tarball_file_path))
        self._process.run(['tar', 'xf', tarball_file_path, '-C', build_dir], cwd=build_dir)

        if release_channel == 'stable':
            # Debchange has already been called at this point. Otherwise the script would'nt be able
            # to create the stable deb files out of the tarball file, but also the checked out
            # repository.
            pass
        elif release_channel == 'nightly' or release_channel == 'unstable':
            config = SafeConfigParser()
            config.read(os.path.join(source_dir, 'version.txt'))
            version = config.get('package', 'VERSION') + '-1'
            pkgdate = config.get('package', 'BUILDDATE')
            hg_id = config.get('package', 'REV')

            msg = 'Automatic build based on the state in Mercurial as of %s (%s)' % (pkgdate,
                                                                                     hg_id)
            env = {'DEBEMAIL': 'info@openattic.org', 'DEBFULLNAME': 'openATTIC Build Daemon', }
            # Adapt the file 'debian/changelog' to build nightly.
            self._process.run(
                [
                    'debchange',
                    '--distribution',
                    'nightly',
                    '--force-distribution',
                    '-v',
                    version + '~' + pkgdate,
                    msg,
                ],
                cwd=source_dir,
                env=env)

        # Move/rename file to the necessary path for `debuild`.
        dst = os.path.join(build_dir, self.determine_deb_tarball_filename(new_tarball_file_path))
        self._process.log_command(['mv', new_tarball_file_path, dst])
        os.rename(new_tarball_file_path, dst)

        self._process.run(['debuild', '-us', '-uc', '-sa'], cwd=source_dir)

        # Sign the changes file.
        name = os.path.basename(new_tarball_file_path)

        # Get the version.
        version = self.extract_version(name)
        small_version = version[0]
        full_version = small_version + '-1'
        if version[1]:
            full_version += '~' + version[1]
        changes_filename = 'openattic_%s_amd64.changes' % full_version

        # Sign the packages with changes file.
        self._process.run(['debsign', '-k', 'A7D3EAFA', changes_filename], build_dir)

        print
        print 'The packages have been created in %s' % build_dir

        if self._args['--publish']:
            self._publish_packages(build_dir, release_channel, version, changes_filename)
            print 'The packages have been published'
            # TODO Show the user what was uploaded optionally.. somehow..

class DebPackageBuilderTest(unittest.TestCase):
    def test_detect_release_by_filename(self):
        target_states = {
            'openattic-2.0.1.tar.bz2': 'stable',
            'openattic-2.0.2.1.tar.bz2': 'stable',
            'openattic_2.0.1.orig.tar.bz2': 'stable',
            'openattic_2.0.2.1.orig.tar.bz2': 'stable',
            'openattic-2.0.4~201512040810.tar.bz2': 'nightly',
            'openattic_2.0.4~201512040810.orig.tar.bz2': 'nightly',
            '~/openattic_2.0.4~201512040810.orig.tar.bz2': 'nightly',
            'openattic_2.0.4.1~201512040810.orig.tar.bz2': 'nightly',
            'openattic.orig.tar.bz2': ParsingError,
            'openattic_2.orig.tar.bz2': ParsingError,
            'openattic-2.0.tar.bz2': 'stable',
            'openattic_2.0.4~201512040810.orig.tar.xzx': 'nightly',
            '~/openattic_2.0.4~201512040810.orig.tar.xz': 'nightly',
            'openattic_2.0.4.1~201512040810.orig.tar.xz': 'nightly',
            'openattic.orig.tar.xz': ParsingError,
            'openattic_2.orig.tar.xz': ParsingError,
            'openattic-2.0.tar.xz': 'stable',
            '': ArgumentError,
        }

        for fname, target_state in target_states.items():
            if isinstance(target_state, str):
                actual_state = DebPackageBuilder.detect_release_with_filename(fname)
                msg = '%s is supposed to be %s but is %s' % (fname, target_state, actual_state)
                self.assertEqual(actual_state, target_state, msg)
            else:
                self.assertRaises(target_state, DebPackageBuilder.detect_release_with_filename,
                                  fname)

    def test_determine_dirname_by_filename(self):
        target_states = {
            'openattic-2.0.1.tar.bz2': 'openattic-2.0.1',
            'openattic_2.0.4.orig.tar.bz2': 'openattic_2.0.4',
            '~/openattic_2.0.4.orig.tar.bz2': 'openattic_2.0.4',
            'openattic_2.0.4~201512040810.orig.tar.bz2': 'openattic_2.0.4~201512040810',
            'openattic-2.0.1.tar.xz': 'openattic-2.0.1',
            'openattic_2.0.4.orig.tar.xz': 'openattic_2.0.4',
            '~/openattic_2.0.4.orig.tar.xz': 'openattic_2.0.4',
            'openattic-2.0.1.tar.xzz': ParsingError,
            'openattic_2.0.4.orig.tar.xzz': ParsingError,
            '~/openattic_2.0.4.orig.tar.xzz': ParsingError,
            'openattic_2.0.4~201512040810.orig.tar.xzz': ParsingError,
            'openattic-2.3.3.xyz': ParsingError,
            '': ArgumentError,
        }

        for fname, target_state in target_states.items():
            if isinstance(target_state, str):
                actual_dirname = DebPackageBuilder.determine_dirname_by_filename(fname)
                msg = 'dirname of %s is supposed to be %s but is %s' % \
                      (fname, target_state, actual_dirname)
                self.assertEqual(target_state, actual_dirname, msg)
            else:
                self.assertRaises(target_state, DebPackageBuilder.determine_dirname_by_filename,
                                  fname)

    def test_determine_deb_tarball_filename(self):
        target_states = {
            '~/path/to/file/openattic-2.0.5~201512141039.tar.bz2': 'openattic_2.0.5.orig.tar.bz2',
            '~/path/to/file/openattic-2.0.5-orig.tar.bz2': 'openattic_2.0.5.orig.tar.bz2',
            '~/path/to/file/openattic-2.0.5_orig.tar.bz2': 'openattic_2.0.5.orig.tar.bz2',
            'oitc-2.0.5_orig.tar.bz2': 'oitc_2.0.5.orig.tar.bz2',
            '': ParsingError,
            'foo': ParsingError,
            'foo.tar': ParsingError,
        }
        for filepath, target_state in target_states.items():
            if isinstance(target_state, str):
                actual_filename = DebPackageBuilder.determine_deb_tarball_filename(filepath)
                msg = '%s was resolved to %s but is expected to be %s'
                msg = msg % (filepath, actual_filename, target_state)
                self.assertEqual(target_state, actual_filename, msg)
            else:
                self.assertRaises(target_state, DebPackageBuilder.determine_deb_tarball_filename,
                                  filepath)

    def test_extract_version_from_tarball(self):
        target_states = {
            'openattic_2.0.4~201512040810.orig.tar.bz2': ('2.0.4', '201512040810'),
            'openattic-2.0.7.tar.bz': ('2.0.7', None),
            'openITCOCKPIT_3.13.20.tar.xz': ('3.13.20', None),
            'openattic-2.0.5.tar': ('2.0.5', None),
            'openITCOCKPIT': ParsingError,
            '2.0.5': ParsingError,
        }

        for name, expected_state in target_states.items():
            if isinstance(expected_state, tuple):
                actual_state = DebPackageBuilder.extract_version(name)
                msg = "Expected %s but found %s" % (repr(expected_state), repr(actual_state))
                self.assertEqual(expected_state, actual_state, msg)


def main():
    args = docopt.docopt(__doc__)
    path_to_tarball = args['<tarball>']
    if path_to_tarball == '-':
        path_to_tarball = sys.stdin.readline().strip()
    deb_pkg_builder = DebPackageBuilder(args)
    release_channel = DebPackageBuilder.detect_release_with_filename(path_to_tarball)
    deb_pkg_builder.build(release_channel, path_to_tarball)


if __name__ == '__main__':
    main()
