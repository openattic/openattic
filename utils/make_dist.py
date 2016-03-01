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
    make_dist.py create <revision> [-v|-q|-s] [--disable-fe-building]
    make_dist.py selftest [<revision>]
    make_dist.py cache push
    make_dist.py help

Create a tarball out of a specific revision to be used as source for package
managers to create debs, rpms, etc.

Arguments:
    revision    'stable', 'unstable' and a valid mercurial revision are allowed
                to be used here.

Options:
    -v          Enables the verbose mode.
    -q          Enables the quiet mode.
    -s          Enables the script mode which prints only the absolute file
                path of the tarball (and output from stderr).

    --disable-fe-building   Disables the build process for frontend files in the debian/rules file.
                            This is ment to be a temporary workaround.
"""

import os
import sys
import subprocess
import re
import unittest
import ConfigParser
from shutil import rmtree, copytree
from os.path import isfile, isdir
from os import makedirs
from datetime import datetime
from hashlib import md5
from docopt import docopt


class ProcessResult(object):

    def __init__(self, stdout, stderr, returncode):
        self.stdout = stdout
        self.stderr = stderr
        self.returncode = returncode

    def __str__(self):
        return self.stdout

    def success(self):
        return self.returncode == 0


class Process(object):
    """Convenient wrapper for `subprocess.Popen()`."""

    def __init__(self, verbosity=1, exit_on_error=True, use_bold_font=True):
        """
        0 - Don't print anything.
        1 - Print the executed command.
        2 - Print the executed command with its output.

        STDERR is always printed.
        """
        self.verbosity = verbosity
        self.exit_on_error = exit_on_error
        self.use_bold = use_bold_font

    def run(self, args, cwd=None, verbosity=None, exit_on_error=None, env=None):
        if verbosity is None:
            verbosity = self.verbosity
        if verbosity > 0:
            self.log_command(args, cwd, self.use_bold)

        pipe = subprocess.Popen(args,
                                # stderr=subprocess.PIPE,
                                stdout=subprocess.PIPE,
                                stdin=subprocess.PIPE,
                                cwd=cwd,
                                env=env)

        process_communication = pipe.communicate()
        result = ProcessResult(
            process_communication[0],
            process_communication[1],
            pipe.returncode)

        if (verbosity > 1 and result.stdout) or not result.success():
            print result.stdout.strip()
        if not result.success():
            if result.stderr:
                print result.stderr
            if self.exit_on_error is True and exit_on_error is not False:
                print "Process exited with non-zero exit code. Exiting..."
                sys.exit(result.returncode)

        return result

    def system(self, args, cwd):
        """
        Make a system call.

        The args aren't escaped automatically. Either don't pass user input to this function or
        escape it properly by using shlex.quote(s).
        """
        self.log_command(args, cwd, self.use_bold)
        os.chdir(cwd)
        return os.system(' '.join(args))

    @staticmethod
    def log_command(args, cwd='', use_bold=True):
        # Enquote args with more than one word.
        display_args = args[:]
        for i, arg in enumerate(display_args):
            if len(arg.split(' ')) > 1:
                display_args[i] = '"%s"' % arg

        command = ' '.join(display_args)

        if use_bold:
            command = '\033[1m' + command + '\033[0m'

        if not cwd:
            print '# %s' % command
        else:
            print '%s# %s' % (cwd, command)


class DistBuilder(object):

    def __init__(self, source_dir, prodname, hg_base_url, args=None):
        self._home_dir = os.environ['HOME']
        self._source_dir = source_dir
        self._prodname = prodname
        self._hg_base_url = hg_base_url
        self._version_txt_path = os.path.join(self._source_dir, prodname, 'version.txt')
        self._package_json_path = os.path.join(self._source_dir, prodname, 'webui', 'package.json')
        self._bower_json_path = os.path.join(self._source_dir, prodname, 'webui', 'bower.json')

        if args:
            self._args = args
        else:
            self._args = docopt(__doc__)

        self._verbosity = 1
        if self._args['-q']:
            self._verbosity = 0
        elif self._args['-v']:
            self._verbosity = 2
        elif self._args['-s']:
            self._verbosity = -1

        self._npmrc_file_path = os.path.join(self._home_dir, '.npmrc')
        self._npm_prefix_row = 'prefix = ~/.node'
        self._cache_dir = os.path.join(self._source_dir, 'oa_cache')
        self._process = Process(self._verbosity)
        self._datestring = datetime.utcnow().strftime('%Y%m%d%H%M')

    def _log(self, message):
        if self._verbosity > 0:
            print message

    @staticmethod
    def _warn(message):
        print '\033[7;49;93m' + message + '\033[0m'

    def _command_exists(self, command):
        return self._process.run(
            ['which', command], exit_on_error=False).success()

    def _check_dependencies(self, commands):
        """Check if the given commands can be found and exit if they couldn't be found."""
        for command in commands:
            if not self._command_exists(command):
                self._fail('Command %s not found!' % command)

    def _get_latest_tag_of_rev(self):
        """Returns the latest global tag of the currently activated revision."""

        result = self._process.run(
            ['hg', 'parents', '--template', '{latesttag}'],
            cwd=os.path.join(self._source_dir, 'openattic'))

        return result.stdout

    def __get_all_tags(self, source_dir):
        """
        Returns a list of tags.

        This function returns the latest tags independently from the currently activated revision
        of the `source_dir`.
        """

        self._process.run(['hg', 'pull'], cwd=source_dir)
        entry_list = self._process.run(
            ['hg', 'tags'],
            cwd=source_dir).stdout.split('\n')
        tags = map(lambda e: re.split(r'\s+', e)[0], entry_list)

        return tags

    @staticmethod
    def _get_md5_of_file(file_name):
        return md5(open(file_name, 'r').read()).hexdigest()

    @staticmethod
    def _sort_version_number_desc(iterable):
        def extract_version_numbers(entry):
            match = re.search(r'v?([\d]+)\.([\d]+)\.([\d]+).*', entry)
            if match:
                return map(int, match.groups())
            return None

        def sort_version_number_desc(a, b):
            if a[0] > b[0]:
                return -1
            elif a[0] < b[0]:
                return 1
            else:
                if a[1] > b[1]:
                    return -1
                elif a[1] < b[1]:
                    return 1
                else:
                    if a[2] > b[2]:
                        return -1
                    elif a[2] < b[2]:
                        return 1
                    else:
                        return 0

        sorted_tags = sorted(iterable, key=extract_version_numbers, cmp=sort_version_number_desc)

        return sorted_tags

    def _get_latest_existing_tag(self):
        source_dir = os.path.join(self._source_dir, 'openattic')
        tags = self.__get_all_tags(source_dir)
        tags.remove('tip')  # We're looking for the latest _labeled_ tag.
        tags = filter(None, tags)  # Remove every item that evaluates to False.
        sorted_tags = self._sort_version_number_desc(tags)

        return sorted_tags[0]

    def _get_upcoming_version(self):
        """Determine the upcoming version for 'unstable' releases."""
        self._process.run(
            ['hg', 'pull', '-u'],
            cwd=os.path.join(self._source_dir, 'openattic'))

        config = ConfigParser.SafeConfigParser()
        try:
            config.read(self._version_txt_path)
            version = config.get('package', 'VERSION')
        except ConfigParser.MissingSectionHeaderError:
            with open(self._version_txt_path, 'r+') as f:
                content = f.read()
                f.seek(0, 0)
                f.write('[package]' + '\n' + content)
            config.read(self._version_txt_path)
            version = config.get('package', 'VERSION')
        return version

    def _resolve_user_rev_to_hg_rev(self, rev):
        """
        Resolve the 'stable' and 'unstable' revision to a valid mercurial revision.

        'stable' resolves to the latest existing tag.
        'unstable' resolves to the 'default' branch.

        Any other revisions are passed trough.
        """

        if rev == 'stable':
            rev = self._get_latest_existing_tag()
        elif rev == 'unstable':
            rev = 'default'

        return rev

    def _remove_npmrc_prefix(self):
        """Remotes the `prefix` variable from the `~/.npmrc` file."""

        with open(self._npmrc_file_path, 'r+') as npmrc:
            content = npmrc.read().split(os.linesep)
            npmrc.seek(0)
            npmrc.truncate()
            result = []
            for row in content:
                if self._npm_prefix_row not in row:
                    result.append(row)
            npmrc.write(os.linesep.join(result))

    def _set_npmrc_prefix(self):
        """
        Allows 'npm -g install' to be used without root privileges.

        Sets the 'prefix' variable in the ~/.npmrc. Creates the file if it
        doesn't exist. It will be extended if the file does already exist.
        """

        # Extend .npmrc appropriately or create it.
        def write_npmrc(fd):
            fd.write(self._npm_prefix_row + os.linesep)

        if not isfile(self._npmrc_file_path):
            with open(self._npmrc_file_path, 'w') as npmrc:
                write_npmrc(npmrc)
                self._log('File .npmrc has been created.')
        else:
            with open(self._npmrc_file_path, 'r+') as npmrc:
                if self._npm_prefix_row not in npmrc.read():
                    write_npmrc(npmrc)
                    self._log('File .npmrc has been extended.')

        # Extend PATH variable.
        os.environ['PATH'] = os.environ['PATH'] + ':' + \
            os.path.join(self._home_dir, '.node/bin')
        self._process.run(['bash', '-c', 'hash -r'])

        # Check for the existence of grunt.
        if not self._command_exists('grunt'):
            self._process.run(['npm', 'install', '-g', 'grunt-cli'])

    @staticmethod
    def _fail(message):
        """
        Writes a message to stderr and exits.
        """

        sys.stderr.write(message + os.linesep)
        sys.exit(2)

    def _clone_sources(self, source_dir, repo_names):
        """Clones the sources to the specified directory.

        source_dir -- The directory where the repositories should be
                      cloned into.
        repo_names -- An array of the names of the repositories.
        """
        if not isdir(source_dir):
            makedirs(source_dir)

        result = {}
        for repo_name in repo_names:
            result['repo_name'] = False
            if not isdir(source_dir + '/' + repo_name):
                repo_url = self._hg_base_url + '/' + repo_name
                repo_target_dir = os.path.join(source_dir + '/' + repo_name)
                self._process.run(['hg', 'clone', repo_url, repo_target_dir])
                result['repo_name'] = True

        return result

    def _prepare_sources(self, rev):
        repositories = {
            'oa_cache': [['hg', 'pull', '--update']],
            'openattic': [['hg', 'update', '--clean', '-r', rev],
                          ['hg', 'pull', '--update']],
        }

        for repo_name, commands in repositories.items():
            for command in commands:
                self._process.run(command,
                                  os.path.join(self._source_dir, repo_name))

    @staticmethod
    def _strip_mercurial_tag(tag):
        """
        Strips the tag to a version-only format. It omits the 'v' and
        unnecessarily added '-1' suffix which is only used by packaging
        systems.
        :param tag:
        :return: `None` or the stripped tag
        """
        hits = re.findall(r'v?([^\-]+)(-\d)?', tag)
        if hits:
            return hits[0][0]  # Return first hit and first group.
        return None

    def _is_existing_tag(self, tag):
        result = self._process.run(
            ['hg', 'tags'],
            cwd=os.path.join(self._source_dir, self._prodname))
        matches = re.findall(r'([^\s]+)\s+[^\s]+', result.stdout)
        if matches:
            return tag in matches
        return False

    def _get_build_basename(self, revision_argument):
        """
        Returns the base name for the given revision.
        E.g. openattic-2.0.4 or openattic-2.0.5~201512021037
        :param revision_argument: stable, unstable, valid mercurial tag or
                                  valid mercurial revision.
        :return: the base name
        """
        build_basename = self._prodname + '-'
        if revision_argument == 'stable':
            tag = self._get_latest_existing_tag()
            latest_stable_version = self._strip_mercurial_tag(tag)
            build_basename += latest_stable_version
        elif revision_argument == 'unstable' or \
                not self._is_existing_tag(revision_argument):
            future_version = self._get_upcoming_version()
            build_basename += future_version + '~' + self._datestring
        else:  # Must be existing mercurial tag.
            build_basename += self._strip_mercurial_tag(revision_argument)

        return build_basename

    def _create_source_tarball(self, build_basename):
        """
        Make some modifications and create the tarball.

        Remove previous version of the current build directory, generate the frontend cache files,
        update the version.txt and create the compressed tar archive.

        It does also contain a temporary workaround for changing the debian/rules file to not contain
        the rules to build the frontend files.

        :param build_basename:
        :return: The absolute file path of the created tarball
        """
        openattic_repo_dir = os.path.join(self._source_dir, 'openattic')
        abs_build_dir = os.path.join(self._source_dir, build_basename)
        abs_tarball_file_path = abs_build_dir + '.tar.bz2'
        bower_components_dir = os.path.join(
            abs_build_dir, 'webui', 'app', 'bower_components')
        node_modules_dir = os.path.join(abs_build_dir, 'webui', 'node_modules')
        webui_dir = os.path.join(abs_build_dir, 'webui')

        # Clean up previous versions.
        if isdir(abs_build_dir):
            rmtree(abs_build_dir)
        if isfile(abs_tarball_file_path):
            os.remove(abs_tarball_file_path)

        self._process.run(
            ['hg', 'archive', '-t', 'files', abs_build_dir, '-X', '.hg*'],
            cwd=os.path.join(self._source_dir, self._prodname))

        self._process.run(['hg', 'pull', '--update'], cwd=self._cache_dir)

        cache = [
            {
                'name': 'npm',
                'checksum_file': self._package_json_path,
                'command': ['npm', 'install'],
                'source_dir': node_modules_dir,
            }, {
                'name': 'bower',
                'checksum_file': self._bower_json_path,
                'command': ['bower', 'install', '--allow-root'],
                'source_dir': bower_components_dir
            }
        ]

        cache_used = True
        for cache_entry in cache:
            if not isfile(cache_entry['checksum_file']):
                msg = "Couldn't find file %s for cache checksum. Skipping " + \
                    "frontend build process!"
                self._warn(msg % cache_entry['checksum_file'])
                cache_used = False
                break

            md5_sum = self._get_md5_of_file(cache_entry['checksum_file'])
            cache_dir = os.path.join(self._cache_dir, cache_entry['name'], md5_sum)
            if not isdir(cache_dir):
                self._log('No cache found for %s' % os.path.basename(cache_entry['checksum_file']))
                self._process.run(cache_entry['command'], cwd=webui_dir)
                copytree(cache_entry['source_dir'], cache_dir)
            else:
                self._log('Cache found for %s. Copying files...' %
                          os.path.basename(cache_entry['checksum_file']))
                copytree(cache_dir, cache_entry['source_dir'])

        if cache_used:  # Build the frontend files.
            self._process.run(['grunt', 'build'], cwd=webui_dir)

            # Remove no longer required packages.
            rmtree(bower_components_dir)
            rmtree(node_modules_dir)

        # version.txt update.
        state = 'stable'
        if self._args['<revision>'] != 'stable':
            state = 'snapshot'
        data = {
            'BUILDDATE': self._datestring,
            'REV': self._get_current_revision_hash(openattic_repo_dir),
            'STATE': state
        }
        version_txt_path = os.path.join(abs_build_dir, 'version.txt')
        with file(version_txt_path, 'a') as f:
            for key, value in data.items():
                f.write('%s = %s%s' % (key, value, os.linesep))

        # Work around the debian/rules file building process for the frontend files.
        if self._args['--disable-fe-building']:
            self._warn('Disabling the frontend file build process...')
            with open(os.path.join(abs_build_dir, 'debian', 'rules'), 'r+') as fh:
                debian_rules = fh.read()
                if 'npm install' in debian_rules or 'bower install' in debian_rules:
                    debian_rules_re = r'[\t ]+which bower \|\| npm install -g bower.*' + \
                                      r'cd webui ; grunt --no-color build\n\t?\n?'
                    debian_rules = re.sub(debian_rules_re, '', debian_rules, 0, re.DOTALL)
                    fh.seek(0)
                    fh.truncate()
                    fh.write(debian_rules)

        # Compress the directory into the tarball file.
        options = 'cjf'
        if self._verbosity > 1:
            options += 'v'
        self._process.run(
            ['tar', options, abs_tarball_file_path, build_basename],
            cwd=self._source_dir)

        rmtree(abs_build_dir)  # Remove no longer required temporary folder.

        return abs_tarball_file_path

    def _get_current_revision_hash(self, repo_dir):
        """
        Returns the long hash of the currently chosen revision of the given
        repository directory.
        :param repo_dir: The directory of the repository.
        :return: The (long) hash of the changeset.
        """
        result = self._process.run(['hg', '--debug', 'id', '-i'],
                                   cwd=repo_dir)
        return result.stdout.strip()

    def _push_remote_cache(self):
        self._process.run(['hg', 'addremove'], cwd=self._cache_dir)
        self._process.run(['hg', 'ci',
                          '-m"Cache updated."', '-u"make_dist.py"'],
                          cwd=self._cache_dir, exit_on_error=False)
        self._process.system(['hg', 'push'], cwd=self._cache_dir)

    def build(self):
        """
        :return: The absolute file path of the newly created tarball.
        """
        self._check_dependencies(['npm'])
        self._set_npmrc_prefix()
        self._clone_sources(self._source_dir, ['oa_cache', 'openattic'])
        user_rev = self._args['<revision>']
        hg_rev = self._resolve_user_rev_to_hg_rev(user_rev)

        # Prepare sources.
        repositories = {
            'oa_cache': [['hg', 'pull', '--update']],
            'openattic': [['hg', 'pull'],
                          ['hg', 'update', '--clean', '-r', hg_rev]]
        }
        for repo_name, commands in repositories.items():
            for command in commands:
                self._process.run(command,
                                  os.path.join(self._source_dir, repo_name))

        build_basename = self._get_build_basename(user_rev)
        abs_tarball_file_path = self._create_source_tarball(build_basename)
        self._remove_npmrc_prefix()

        return abs_tarball_file_path

    def run(self):
        if self._args['help']:
            print __doc__
            sys.exit(0)
        elif self._args['selftest']:
            self._self_test()
        elif self._args['cache'] and self._args['push']:
            self._push_remote_cache()
        elif self._args['create'] and self._args['<revision>']:
            abs_tarball_file_path = self.build()
            if self._verbosity == -1:
                print abs_tarball_file_path
            else:
                print 'Tarball has been created: %s' % abs_tarball_file_path

    def _self_test(self):
        self._clone_sources(self._source_dir, ['openattic'])
        repo_dir = os.path.join(self._source_dir, 'openattic')
        rev = self._args['<revision>'] or 'tip'
        rev = self._resolve_user_rev_to_hg_rev(rev)
        self._process.run(['hg', 'update', rev], cwd=repo_dir)
        self._process.run(['hg', 'pull', '--update'], cwd=repo_dir)
        unittest.main('make_dist', argv=[sys.argv[0]])


class DistBuilderTest(unittest.TestCase):

    def setUp(self):
        self._dist_builder = DistBuilder(
            source_dir=os.path.join(os.environ['HOME'], 'src'),
            prodname='openattic',
            hg_base_url='https://bitbucket.org/openattic',
            args={'-q': True})
        self.version_regexp = r'\d+\.\d+\.\d+'
        self.timestamp_regexp = r'20\d{8}'

    def test_get_build_basename_stable(self):
        build_basename = self._dist_builder._get_build_basename('stable')
        stable_build_regexp = self._dist_builder._prodname + r'-' + \
            self.version_regexp
        self.assertRegexpMatches(build_basename, stable_build_regexp)

    def test_get_build_basename_unstable(self):
        build_name = self._dist_builder._get_build_basename('unstable')
        unstable_build_regexp = self._dist_builder._prodname + r'-' + \
            self.version_regexp + r'~' + self.timestamp_regexp
        self.assertRegexpMatches(build_name, unstable_build_regexp)


if __name__ == '__main__':
    dist_builder = DistBuilder(source_dir=os.environ['HOME'] + '/src',
                               prodname='openattic',
                               hg_base_url='https://bitbucket.org/openattic')
    dist_builder.run()
