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
    make_dist.py create (release|snapshot) [--revision=<revision>]
        [--source=<source>] [--destination=<destination>]
        [--adapt-debian-changelog] [--push-changes] [-v|-q|-s]
    make_dist.py cache push
    make_dist.py (help|-h|--help)

Create a tarball out of a specific revision to be used as source for package
managers to create debs, rpms, etc.

This script always prints errors to STDERR. This behaviour can't be turned
of by any switch provided.

Options:

    --revision=<revision>

        A valid mercurial revision. An existing mercurial tag for 'release'.

        If no revision is provided, the defaults are used. The default for
        'release' is the latest existing mercurial tag. The default for
        'snapshot' is the development branch, which actually results in the tip
        of the development branch being used.

        The revision argument will be ignored if a path to a local repository
        is used as argument for --source and if that repo contains uncommitted
        changes. In that case these uncommited changes are committed in a
        temporary directory to be able include them in the tar archive.

    --source=<source>  [default: https://bitbucket.org/openattic/openattic]

        The source to be used. Either an URL to a Mercurial repository or local
        path to a Mercurial repository.

        If a local path is used, uncommited changes will be automatically
        committed and used to create the tarball. Because of that the
        --push-changes switch is ignored if a local path is given to --source.
        The local repository is never altered, only a temporary copy of it will
        be adapted.

    --destination=<destination>  [default: ~/src]

        The destination for the tar archive to be created in. If the given
        directory or subdirectories don't exist, they will be created.

    --adapt-debian-changelog

        If enabled, the `debian/changelog` is updated using `debchange`.
        Because `debchange` is not available on every system, this switch is
        optional and the functionality is disabled by default.

    --push-changes

        Pushes the changes made to the repository. This switch is ment to be
        used on a release to push the changes made back to the repository.
        Those changes include the adaption of the `debian/changelog` file as
        well as the creation of Mercurial tags. The latter is not yet
        implemented. This switch will be ignored if the argument to --source is
        a local path and changes have been commited to create a tar archive for
        testing purposes. If there weren't changes to the repository, the
        switch won't be ignored. If the push creates a new head on the remote
        repository, the changes won't be pushed and the execution of the
        script will be aborted.

    -v

        Enables the verbose mode. Prints the output of every command called to
        stdout.

    -q

        Enables the quiet mode. No output except for the success message and
        path to the created tar archive.

    -s

        Enables the script mode which prints the absolute path of the tarball
        at the end of the tarball creation to stdout.
"""

import os
import sys
import subprocess
import re
import tempfile
import unittest
import ConfigParser
from shutil import rmtree, copytree
from os.path import isfile, isdir
from os import makedirs
from datetime import datetime
from hashlib import md5
from docopt import docopt
from urlparse import urlparse

VERBOSITY_SCRIPT = -1
VERBOSITY_QUIET = 0
VERBOSITY_NORMAL = 1
VERBOSITY_VERBOSE = 2


class ProcessResult(object):
    def __init__(self, stdout, stderr, returncode):
        """
        :type stdout: str
        :type stderr: str
        :type returncode: int
        """
        self.stdout = stdout
        self.stderr = stderr
        self.returncode = returncode

    def __str__(self):
        return self.stdout

    def success(self):
        """
        :rtype: bool
        """
        return self.returncode == 0


class Process(object):
    """Convenient wrapper for `subprocess.Popen()`."""

    def __init__(self, verbosity=VERBOSITY_NORMAL, exit_on_error=True, use_bold_font=True):
        self.verbosity = verbosity
        self.exit_on_error = exit_on_error
        self.use_bold = use_bold_font

    def run(self, args, cwd=None, exit_on_error=None, env=None):
        self.log_command(args, cwd, self.use_bold)
        exit_on_error = self.exit_on_error is True and exit_on_error is not False

        pipe = subprocess.Popen(args,
                                stderr=subprocess.PIPE,
                                stdout=subprocess.PIPE,
                                stdin=subprocess.PIPE,
                                cwd=cwd,
                                env=env,
                                bufsize=1,
                                close_fds=True)

        tmp_result = {'stdout': [], 'stderr': []}

        for line in iter(pipe.stdout.readline, b''):
            tmp_result['stdout'].append(line.strip())
            if self.verbosity > VERBOSITY_NORMAL:
                sys.stdout.write(line)
                sys.stdout.flush()

        if pipe.stderr:
            for line in iter(pipe.stderr.readline, b''):
                tmp_result['stderr'].append(line.strip())
                sys.stderr.write(line)
                sys.stderr.flush()

        result = ProcessResult(os.linesep.join(tmp_result['stdout']),
                               os.linesep.join(tmp_result['stderr']),
                               returncode=pipe.wait())

        if not result.success():
            # Print stdout on failure too. Some tools like Grunt print errors to stdout!
            if result.stdout and self.verbosity <= VERBOSITY_NORMAL and exit_on_error:
                # Only print stdout if already printed and exit_on_error is True, otherwise we
                # want to ignore the output for being able to silence the script. Sadly some tools
                # are inconsistent with their error printing, so we need to do that here.
                print result.stdout

            if exit_on_error:
                # Print message on exit for the sake of debugging.
                print('Error occurred, exiting')
                sys.exit(result.returncode)

        return result

    def system(self, args, cwd):
        """Make a system call.

        The args aren't escaped automatically. Either don't pass user input to this function or
        escape it properly by using shlex.quote(s).

        :param args: A list of arguments
        :type args: list[str]
        :param cwd: Current working directory
        :type cwd: str
        :return:
        """
        self.log_command(args, cwd, self.use_bold)
        os.chdir(cwd)
        return os.system(' '.join(args))

    def log_command(self, args, cwd='', use_bold=True):
        """Log a command call.

        :param args: List of arguments
        :type args: list[str]
        :param cwd: Current working directory
        :type cwd: str
        :param use_bold:
        :type use_bold: bool
        """
        if self.verbosity < VERBOSITY_NORMAL:
            return

        # Enquote args with more than one word.
        display_args = args[:]
        for i, arg in enumerate(display_args):
            if len(arg.split(' ')) > 1:
                display_args[i] = '"%s"' % arg

        command = ' '.join(display_args)
        command = '\033[1m' + command + '\033[0m' if use_bold else command

        sys.stdout.write('(cwd)# {}\n'.format(command) if not cwd else
                         '{}# {}\n'.format(cwd, command))
        sys.stdout.flush()


class DistBuilder(object):
    OA_CACHE_REPO_URL = 'https://bitbucket.org/openattic/oa_cache'

    def __init__(self, args=None):
        self._home_dir = os.environ['HOME']
        self._args = args if args else docopt(__doc__)

        if self._args['--destination']:
            destination = os.path.expanduser(self._args['--destination'])
            self._destination_dir = os.path.abspath(destination)
        self._source = self._args['--source']
        self._source_is_path = not DistBuilder.is_url(self._source)
        if self._source_is_path:
            self._source = os.path.abspath(self._source)
        self._tmp_dir = os.path.join(tempfile.gettempdir(), 'oa_tmp_build_dir')
        self._source_basename = DistBuilder.get_basename(self._source)
        self._tmp_build_dir = os.path.join(self._tmp_dir, self._source_basename)
        self._version_txt_path = os.path.join(self._tmp_build_dir, 'version.txt')
        self._package_json_path = os.path.join(self._tmp_build_dir, 'webui', 'package.json')
        self._bower_json_path = os.path.join(self._tmp_build_dir, 'webui', 'bower.json')

        self._verbosity = VERBOSITY_NORMAL
        if self._args['-q']:
            self._verbosity = VERBOSITY_QUIET
        elif self._args['-v']:
            self._verbosity = VERBOSITY_VERBOSE
        elif self._args['-s']:
            self._verbosity = VERBOSITY_SCRIPT

        self._npmrc_file_path = os.path.join(self._home_dir, '.npmrc')
        self._npm_prefix_row = 'prefix = ~/.node'
        self._cache_dir = os.path.join(self._home_dir, '.cache', 'openattic-build')
        self._process = Process(self._verbosity)
        self._datestring = datetime.utcnow().strftime('%Y%m%d%H%M')

    def _log(self, message):
        if self._verbosity > 0:
            print message

    @staticmethod
    def is_url(string):
        assert type(string) is str
        return urlparse(string).netloc != ''

    @staticmethod
    def _warn(message):
        sys.stderr.write('\033[103;30m{}\033[0m{}'.format(message, os.linesep))

    def _command_exists(self, command):
        return self._process.run(['which', command], exit_on_error=False).success()

    def _check_dependencies(self, commands):
        """Check the existence of the given commands.

        Fails if any command does not exist.

        :param commands: A list of commands
        :type commands: list[str]
        """
        for command in commands:
            if not self._command_exists(command):
                self._fail('Command %s not found!' % command)

    def _get_latest_tag_of_rev(self):
        """Return the latest global tag of the currently activated revision."""
        result = self._process.run(['hg', 'parents', '--template', '{latesttag}'],
                                   cwd=self._tmp_build_dir)
        return result.stdout

    def __get_all_tags(self, source_dir):
        """Retrieve all tags of the specified mercurial source directory.

        This function returns the latest tags independent from the currently activated revision
        of the given `source_dir`.

        :param source_dir: A path to a mercurial source directory
        :type source_dir: str
        :return: A list of tags
        """
        self._process.run(['hg', 'pull'], cwd=source_dir)
        tags = self._process.run(['hg', 'tags'], cwd=source_dir).stdout.split('\n')
        tags = map(lambda e: re.split(r'\s+', e)[0], tags)

        return tags

    @staticmethod
    def _get_md5_of_file(file_name):
        return md5(open(file_name, 'r').read()).hexdigest()

    @staticmethod
    def _sort_version_number_desc(iterable):
        def extract_version_numbers(entry):
            match = re.search(r'v?([\d]+)\.([\d]+)\.([\d]+).*', entry)
            return map(int, match.groups()) if match else None

        return sorted(iterable, key=extract_version_numbers, reverse=True)

    def _get_latest_existing_tag(self, strip_tag=False):
        tags = self.__get_all_tags(self._tmp_build_dir)
        tags.remove('tip')  # We're looking for the latest _labeled_ tag. So we exclude 'tip'.
        tags = filter(None, tags)  # Remove every item that evaluates to False.
        latest_tag = self._sort_version_number_desc(tags)[0]
        latest_tag = self._strip_mercurial_tag(latest_tag) if strip_tag else latest_tag

        return latest_tag

    def _get_version_of_revision(self, revision, update_allowed):
        """Return the version of `version.txt` using the given revision.

        It returns the VERSION of the version.txt file in the repository. The version returned
        depends on the given revision.

        :param revision: A valid mercurial revision
        :type revision: str
        :type update_allowed: bool
        :return: The version of the `version.txt`
        :rtype: str
        """
        if update_allowed:
            # Update to the given revision before determining the upcoming version. Don't do this if
            # the source is a path, because that one is for creating tarballs to be tested before
            # releasing them.
            self._process.run(['hg', 'update', revision], cwd=self._tmp_build_dir)

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

    def _get_revision_by_channel(self, channel):
        """Return the revision corresponding to the given release channel.

        This function provides the default revision for calls of this script which do NOT provide a
        revision argument, so that the revision has to be determined automatically.

        If the channel is 'release', the revision will resolve to the latest existing mercurial tag.
        If it's 'snapshot' it will resolve to the tip of the default branch.

        :param channel: 'release' | 'snapshot'
        :type channel: str
        :return: A valid mercurial revision
        """
        assert channel in ('release', 'snapshot')
        return self._get_latest_existing_tag() if channel == 'release' else 'default'

    def _remove_npmrc_prefix(self):
        """Remove the `prefix` variable from the `~/.npmrc` file."""

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
        """Enable 'npm -g install' to be used without root privileges.

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
        os.environ['PATH'] = os.environ['PATH'] + ':' + os.path.join(self._home_dir, '.node/bin')
        self._process.run(['bash', '-c', 'hash -r'])

        # Check for the existence of grunt.
        if not self._command_exists('grunt'):
            self._process.run(['npm', 'install', '-g', 'grunt-cli'])

    @staticmethod
    def _fail(message):
        """Write a message to stderr and exit.

        :type message: str
        """
        sys.stderr.write(message + os.linesep)
        sys.exit(2)

    def _retrieve_source(self, destination_dir, source, skip_if_exists=False):
        """Clone or copy the sources to the specified directory.

        Skips the process if the target directory already exists. The target directory is determined
        using the target_dir argument and the basename of the source.

        :param destination_dir: The directory where the sources should be cloned/copied to.
        :type destination_dir: str
        :param source: The source. These may be a path or a URL.
        :type source: str
        """
        if not isdir(destination_dir):
            makedirs(destination_dir)

        abs_source_dir = os.path.join(destination_dir, DistBuilder.get_basename(source))
        if isdir(abs_source_dir) and skip_if_exists:
            self._log('Skipping retrieval of {} because it already exists'.format(source))
            return

        self._process.run(['hg', 'clone', source, abs_source_dir])

    @staticmethod
    def _strip_mercurial_tag(tag):
        """Strip the given tag to a version-only format.

        It omits the 'v' prefix and '-1' suffix. The latter is only used by packaging systems and
        unecessary in this context.

        :param tag:
        :type tag: str
        :return: `None` or the stripped mercurial tag
        """
        hits = re.findall(r'v?([^\-]+)(-\d)?', tag)
        return hits[0][0] if hits else None  # Return first hit of first group or None.

    def _is_existing_tag(self, tag):
        result = self._process.run(['hg', 'tags'], cwd=self._tmp_build_dir)
        matches = re.findall(r'([^\s]+)\s+[^\s]+', result.stdout)

        return tag in matches if matches else False

    def _get_build_basename(self, channel, version):
        """Return the base name for the given revision.

        Depending on the channel, this may either like `openattic-2.0.4` or
        `openattic-2.0.5~201512021037`.

        :param channel: release | snapshot
        :type channel: str
        :return: The base name
        """
        assert channel in ('release', 'snapshot')

        build_basename = 'openattic-{}'.format(version)
        build_basename += '~' + self._datestring if channel == 'snapshot' else ''

        return build_basename

    def _create_source_tarball(self, build_basename):
        """Make some necessary modifications and create the tarball.

        Remove the previous version of the current build directory, generate the frontend cache
        files if necessary, update the version.txt and create the compressed tar archive.

        :param build_basename:
        :type build_basename: str
        :return: The absolute file path of the created tarball
        """
        tmp_abs_build_dir = os.path.join(self._tmp_dir, build_basename)
        abs_tarball_dest_file = os.path.join(self._destination_dir, build_basename + '.tar.bz2')

        bower_components_dir = os.path.join(tmp_abs_build_dir, 'webui', 'app', 'bower_components')
        node_modules_dir = os.path.join(tmp_abs_build_dir, 'webui', 'node_modules')
        webui_dir = os.path.join(tmp_abs_build_dir, 'webui')

        # Clean up previous versions.
        if isdir(tmp_abs_build_dir):
            self._process.log_command(['rm', '-r', tmp_abs_build_dir])
            rmtree(tmp_abs_build_dir)
        if isfile(abs_tarball_dest_file):
            self._process.log_command(['rm', abs_tarball_dest_file])
            os.remove(abs_tarball_dest_file)

        self._process.run(['hg', 'archive', '-t', 'files', tmp_abs_build_dir, '-X', '.hg*'],
                          cwd=self._tmp_build_dir)
        self._process.run(['hg', 'pull', '--update'], cwd=self._cache_dir)

        cache = [{
            'name': 'npm',
            'checksum_file': self._package_json_path,
            'command': ['npm', 'install'],
            'source_dir': node_modules_dir,
        }, {
            'name': 'bower',
            'checksum_file': self._bower_json_path,
            'command': ['bower', 'install', '--allow-root'],
            'source_dir': bower_components_dir
        }]

        cache_used = True
        for cache_entry in cache:
            if not isfile(cache_entry['checksum_file']):
                msg = "Couldn't find file %s for cache checksum. Skipping the frontend build " + \
                      "process!"
                self._warn(msg % cache_entry['checksum_file'])
                cache_used = False
                break

            md5_sum = self._get_md5_of_file(cache_entry['checksum_file'])
            cache_dir = os.path.join(self._cache_dir, cache_entry['name'], md5_sum)
            if not isdir(cache_dir):
                log_msg = 'No cache found for {}'
                self._log(log_msg.format(os.path.basename(cache_entry['checksum_file'])))
                self._process.run(cache_entry['command'], cwd=webui_dir)
                copytree(cache_entry['source_dir'], cache_dir)  # Update cache dir.
            else:
                log_msg = 'Cache found for {}. Copying files...'
                self._log(log_msg.format(os.path.basename(cache_entry['checksum_file'])))
                copytree(cache_dir, cache_entry['source_dir'])  # Use cache dir.

        if cache_used:  # Build the frontend files.
            self._process.run(['grunt', 'build'], cwd=webui_dir)

            # Remove no longer required dirs.
            self._process.log_command(['rm', '-r', bower_components_dir])
            rmtree(bower_components_dir)
            self._process.log_command(['rm', '-r', node_modules_dir])
            rmtree(node_modules_dir)

        # Update version.txt.
        data = {
            'BUILDDATE': self._datestring,
            'REV': self._get_current_revision_hash(self._tmp_build_dir),
            'STATE': self._get_release_channel(),
        }
        with file(os.path.join(tmp_abs_build_dir, 'version.txt'), 'a') as f:
            for key, value in data.items():
                f.write('{} = {}{}'.format(key, value, os.linesep))

        # Compress the directory into the tarball file.
        options = 'cjf'
        options += 'v' if self._verbosity > 1 else ''

        # Make sure the directory exists where the tarball should be placed into.
        abs_tarball_dest_path = os.path.split(abs_tarball_dest_file)[0]
        if not os.path.isdir(abs_tarball_dest_path):
            self._process.log_command(['mkdir', '-p', abs_tarball_dest_path])
            makedirs(abs_tarball_dest_path)

        self._process.run(['tar', options, abs_tarball_dest_file, build_basename],
                          cwd=self._tmp_dir)

        rmtree(tmp_abs_build_dir)  # Remove no longer required temporary folder.

        return abs_tarball_dest_file

    def _get_current_revision_hash(self, repo_dir):
        """Retrieve the hash of the current revision.

        Returns the long hash of the currently active revision of the given repository directory.

        :param repo_dir: The directory of the repository
        :type repo_dir: str
        :return: The long hash of the current changeset
        """
        result = self._process.run(['hg', '--debug', 'id', '-i'], cwd=repo_dir)
        return result.stdout.strip()

    def _commit_changes(self, commit_msg, repo_dir, user='Build Scripts', exit_on_error=False):
        """
        :type commit_msg: str
        :type repo_dir: str
        :type user: str
        :type exit_on_error: bool
        :rtype: ProcessResult
        """
        return self._process.run(['hg', 'ci', '-A', '-m', commit_msg, '-u', user],
                                 cwd=repo_dir,
                                 exit_on_error=exit_on_error)

    def _push_changes(self, repo_dir):
        return self._process.system(['hg', 'push'], cwd=repo_dir)

    def _get_release_channel(self):
        return 'release' if self._args['release'] else 'snapshot'

    def build(self):
        """
        :return: The absolute file path of the newly created tarball.
        """
        self._check_dependencies(['npm'])
        self._set_npmrc_prefix()

        self._retrieve_source(os.path.split(self._cache_dir)[0], DistBuilder.OA_CACHE_REPO_URL,
                              skip_if_exists=True)
        self._process.run(['hg', 'pull', '--update'], cwd=self._cache_dir)

        if self._source_is_path and isdir(self._tmp_build_dir):
            self._process.log_command(['rm', '-r', self._tmp_build_dir])
            rmtree(self._tmp_build_dir)
        self._retrieve_source(self._tmp_dir, self._source, skip_if_exists=True)

        channel = self._get_release_channel()
        revision = self._args['--revision'] or self._get_revision_by_channel(channel)

        tmp_files_commited = False
        repo_updated = False
        if self._source_is_path:
            tmp_files_commited = self._commit_changes('Testbuild', self._tmp_build_dir).success()

            if self._args['--revision']:
                if tmp_files_commited:
                    self._warn('Ignoring the --revision switch because you have uncommitted files '
                               'in your local repository which are about to be used to create the '
                               'tarball. If I updated to the given revision, these changes '
                               'wouldn\'t be included in the tar archive anymore.')
                else:
                    for cmd in [['hg', 'pull'], ['hg', 'update', '--clean', '-r', revision]]:
                        self._process.run(cmd, cwd=self._tmp_build_dir)
                    repo_updated = True
        else:
            for cmd in [['hg', 'pull'], ['hg', 'update', '--clean', '-r', revision]]:
                self._process.run(cmd, cwd=self._tmp_build_dir)
            repo_updated = True

        version = self._get_version_of_revision(revision, update_allowed=repo_updated)
        build_basename = self._get_build_basename(channel, version)

        if self._args['--adapt-debian-changelog']:
            debian_channel = 'stable' if channel == 'release' else 'nightly'
            self.adapt_debian_changelog(debian_channel,
                                        version,
                                        self._datestring,
                                        self._get_current_revision_hash(self._tmp_build_dir),
                                        self._tmp_build_dir)
            self._commit_changes('Update `debian/changelog` for release', self._tmp_build_dir)

        abs_tarball_file_path = self._create_source_tarball(build_basename)

        if self._args['--push-changes']:
            # Push the changes after the tarball has successfully been created.
            if not tmp_files_commited:
                self._push_changes(self._tmp_build_dir)
            else:
                self._warn('Ignoring the --push-changes switch because temporary files of the given'
                           ' source have been comitted.')

        rmtree(self._tmp_build_dir)
        self._remove_npmrc_prefix()

        return abs_tarball_file_path

    def run(self):
        if self._args['help']:
            print __doc__
            sys.exit(0)
        elif self._args['cache'] and self._args['push']:
            self._commit_changes('Update cache', self._cache_dir)
            self._push_changes(self._cache_dir)
        elif self._args['create']:
            abs_tarball_file_path = self.build()
            if self._verbosity == -1:
                print abs_tarball_file_path
            else:
                print 'Tarball has been created: %s' % abs_tarball_file_path

    @staticmethod
    def get_basename(source):
        return os.path.basename(os.path.normpath(source))

    def adapt_debian_changelog(self, release_channel, version, pkgdate, hg_id, tarball_source_dir):
        # Provide necessary information.
        env = {'DEBEMAIL': 'info@openattic.org', 'DEBFULLNAME': 'openATTIC Build Daemon'}
        if release_channel == 'stable':
            newversion = version
            msg = 'New upstream release {}, see CHANGELOG for details'.format(version)
            distribution = 'unstable'
        else:
            newversion = version + '~' + pkgdate
            msg = 'Automatic build based on the state in Mercurial as of %s (%s)' % (pkgdate, hg_id)
            distribution = 'nightly'

        # Adapt the `debian/changelog` file via `debchange`.
        self._process.run(
            [
                'debchange',
                '--distribution',
                distribution,
                '--force-distribution',
                '--force-bad-version',  # Allows the version to be lower than the current one.
                '--newversion',
                newversion,
                msg,
            ],
            cwd=tarball_source_dir,
            env=env)


class DistBuilderTestCase(unittest.TestCase):

    def test_get_basename(self):
        sources = [
            'http://bitbucket.org/openattic/openattic',
            'http://bitbucket.org/openattic/openattic/',
            '/root/src/openattic',
            '/root/src/openattic/',
        ]
        self.assertEqual([DistBuilder.get_basename(source) for source in sources],
                         ['openattic'] * len(sources))

    def test_sort_version_numbers(self):
        version_numbers = [
            'v1.2.0-2',
            'v1.2.0-1',
            'v1.1.1-1',
            'v1.0.7-1',
            'v0.7.4-2',
            'v0.7.4-1',
            'v2.0.1-gui',
            'v2.0.0-gui',
            'v2.0.1',
            'v2.0.0',
            'v1.2.1',
            'v1.2.0',
            'v1.1.1',
            'v1.1.0',
            'v1.0.7',
            'v0.7.4',
            'v2.0.2-1',
            'v0.7.3',
        ]
        expected = [
            'v2.0.2-1',
            'v2.0.1-gui',
            'v2.0.1',
            'v2.0.0-gui',
            'v2.0.0',
            'v1.2.1',
            'v1.2.0-2',
            'v1.2.0-1',
            'v1.2.0',
            'v1.1.1-1',
            'v1.1.1',
            'v1.1.0',
            'v1.0.7-1',
            'v1.0.7',
            'v0.7.4-2',
            'v0.7.4-1',
            'v0.7.4',
            'v0.7.3'
        ]
        self.assertNotEqual(version_numbers, expected)
        self.assertEqual(DistBuilder._sort_version_number_desc(version_numbers), expected)


if __name__ == '__main__':
    dist_builder = DistBuilder()
    dist_builder.run()
