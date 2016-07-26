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
import glob
import os
import sys
import re
import tempfile
import unittest
import shutil
import docopt
from os.path import isdir, isfile, basename
from make_dist import Process
from ConfigParser import SafeConfigParser
from datetime import datetime


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
    def detect_release_by_filename(tarball_filename):
        """Detect the type of the release by the filename of the tarball.

        :param tarball_filename:
        :type tarball_filename: str
        :return: nightly | stable
        """
        stable_re = r'\w+[_-]\d+\.\d+(\.\d+)?[\w+\.]+'
        unstable_re = r'\w+[_-]\d+\.\d+\.\d+(\.\d+)?\~\d{12}[\w+\.]+'

        if not tarball_filename or not isinstance(tarball_filename, str):
            raise ArgumentError

        tarball_filename = basename(tarball_filename)

        # Test for unstable first, because the re it more exact.
        if re.match(unstable_re, tarball_filename):
            return 'nightly'
        if re.match(stable_re, tarball_filename):
            return 'stable'

        raise ParsingError

    @staticmethod
    def determine_dirname_by_filename(tarball_filename):
        """Determine the directory name of the tarball using the file name of the tarball.

        :param tarball_filename: The filename of the tarball
        :type tarball_filename: str
        :return: The name of the directory
        """
        if not tarball_filename or not isinstance(tarball_filename, str):
            raise ArgumentError

        tarball_filename = basename(tarball_filename)

        regex = r'\.tar\.(bz2|gz|lxma|xz)$'
        if re.search(regex, tarball_filename):
            tarball_filename = re.sub(regex, '', tarball_filename)
        else:
            raise ParsingError

        dirname = re.sub(r'\.orig$', '', tarball_filename)

        return dirname

    @staticmethod
    def determine_deb_tarball_filename(filepath):
        """Determines the deb tarball filename for debian.

        :param filepath: The path of the tarball
        :type filepath: str
        :return: The filename of the tarball
        """
        filename = basename(filepath)
        regex = r'^(\w+)[-_](\d+\.\d+\.\d+(\.\d+)?)[\w~-]*(\.tar\.(bz2|gz|lxma|xz))$'

        match = re.search(regex, filename)
        if match:
            filename = match.group(1) + '_' + match.group(2) + '.orig' + match.group(4)
            return filename

        raise ParsingError

    @staticmethod
    def extract_version(filename):
        """Extract the version of the given tarball filename.

        :param filename:
        :type filename: str
        :return: A tuple with the version as first element and the datestring as second if it exists
        """
        if filename:
            match = re.search(r'.*?([\d\.]+)~?(\d+)?.*\.tar.*', filename)
            if match:
                return match.group(1), match.group(2)

        raise ParsingError

    def _publish_packages(self, pkgdir, release_channel, changes_filename):
        """Publish a package using the `reprepro` command.

        :type pkgdir: str
        :type release_channel: str
        :type changes_filename: str
        """
        dirs = filter(isdir, glob.glob(os.path.join(pkgdir, '*')))
        if len(dirs) != 1:
            msg = 'The package directory has to contain exactly one directory "{}"'
            raise FileNotFoundError(msg.format(pkgdir))
        control_file = os.path.join(pkgdir, dirs[0], 'debian', 'control')

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

    def extract_tarball(self, tarball_file_path, destination):
        """Extract a tarball and return the path to it's files.

        The path may not be `destination` but `destination` plus the folder of the tarball, if the
        files are in that toplevel folder of the tarball. This method does the same as dpkg-source
        to determine the directory structure of the tarball. The strategy is mentioned in the
        best practices for .orig.tar.{gz,bz2,xz} files in section 6.7.8 and 6.7.81 of the following
        document.

        https://www.debian.org/doc/manuals/developers-reference/best-pkging-practices.html#pristinesource

        :type tarball_file_path: str
        :param destination: The desired destination directory
        :type destination: str
        :rtype: str
        :return: The path to the directory of the extracted content of the tarball
        """
        if not os.path.isfile(tarball_file_path):
            raise FileNotFoundError()

        # Extract the tarball to a temporary folder.
        tmpdir = tempfile.mkdtemp()
        self._process.run(['tar', 'xf', tarball_file_path, '-C', tmpdir])

        dir_content = filter(isdir, glob.glob(os.path.join(tmpdir, '*')))
        files = filter(isfile, dir_content)
        directories = filter(isdir, dir_content)

        # Check if the tarball contains only one directory.
        if len(directories) == 1 and len(files) == 0:
            source = directories[0]
            destination = os.path.join(destination, basename(source))
        else:
            msg = 'Tarballs not containing a single directory aren\'t supported so far'
            raise NotImplementedError(msg)

        if os.path.exists(destination):
            shutil.rmtree(destination)

        shutil.move(source, destination)
        self._process.log_command(['mv', source, destination])

        shutil.rmtree(tmpdir)
        self._process.log_command(['rm', '-r', tmpdir])

        return destination

    @staticmethod
    def get_empty_build_dir():
        """Return an empty build directory.
        :rtype: str
        """
        build_dir = os.path.join(os.environ['HOME'], 'src', 'deb_builds')
        if os.path.isdir(build_dir):
            shutil.rmtree(build_dir)
        os.makedirs(build_dir)

        return build_dir

    @staticmethod
    def get_config_txt_values(tarball_source_dir):
        config = SafeConfigParser()
        config.read(os.path.join(tarball_source_dir, 'version.txt'))

        version = config.get('package', 'VERSION') + '-1'
        pkgdate = config.get('package', 'BUILDDATE')
        hg_id = config.get('package', 'REV')

        return version, pkgdate, hg_id

    def build(self, release_channel, tarball_file_path):
        """Build the debian packages.

        :param release_channel: Either 'stable' or 'nightly'
        :type release_channel: str
        :param tarball_file_path: The path of the tarball
        :type tarball_file_path: str
        """
        assert release_channel in ('stable', 'nightly')

        build_dir = DebPackageBuilder.get_empty_build_dir()
        tarball_source_dir = self.extract_tarball(tarball_file_path, build_dir)
        self._process.log_command(['cp', tarball_file_path, build_dir])
        shutil.copy(tarball_file_path, build_dir)
        shutil.move(os.path.join(build_dir, basename(tarball_file_path)),
                    os.path.join(build_dir, self.determine_deb_tarball_filename(tarball_file_path)))

        self._process.run(['debuild', '-us', '-uc', '-sa'], cwd=tarball_source_dir)

        changes_filename = basename(glob.glob(os.path.join(build_dir, '*.changes'))[0])
        # Sign the packages with changes file.
        self._process.run(['debsign', '-k', 'A7D3EAFA', changes_filename], build_dir)

        print 'The packages have been created in %s' % build_dir

        if self._args['--publish']:
            self._publish_packages(build_dir, release_channel, changes_filename)
            print 'The packages have been published'
            # TODO Maybe ask the user to show what was uploaded?
            #      Only if an interactive terminal is used.


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
                actual_state = DebPackageBuilder.detect_release_by_filename(fname)
                msg = '%s is supposed to be %s but is %s' % (fname, target_state, actual_state)
                self.assertEqual(actual_state, target_state, msg)
            else:
                self.assertRaises(target_state, DebPackageBuilder.detect_release_by_filename,
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

        for filename, expected_state in target_states.items():
            if isinstance(expected_state, tuple):
                actual_state = DebPackageBuilder.extract_version(filename)
                msg = "Expected %s but found %s" % (repr(expected_state), repr(actual_state))
                self.assertEqual(expected_state, actual_state, msg)


def main():
    args = docopt.docopt(__doc__)
    path_to_tarball = args['<tarball>']
    if path_to_tarball == '-':
        path_to_tarball = sys.stdin.readline().strip()
    deb_pkg_builder = DebPackageBuilder(args)
    release_channel = DebPackageBuilder.detect_release_by_filename(path_to_tarball)
    deb_pkg_builder.build(release_channel, path_to_tarball)


if __name__ == '__main__':
    main()
