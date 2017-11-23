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
        [--adapt-debian-changelog] [--push-changes] [--tag]
        [--sign] [--suffix=<suffix>] [-v|-q|-s]
   make_dist.py cache push
   make_dist.py (help|-h|--help)

   Create a tarball out of a specific revision to be used as source for package
   managers to create debs, rpms, etc.

   This script always prints errors to STDERR. This behaviour can't be turned off
   by any switch provided.

   Options:

   --revision=<revision>

        Ignored for compatibility reasons. Will always be HEAD.

   --source=<source>  [default: .]

        The source to be used. A local path to a git repository.

        If the --push-changes switch is used but there are uncommited changes in
        the source directory, the switch will be ignored and a appropriate
        warning will be printed.

   --destination=<destination>  [default: ~/src]

        The destination for the tar archive to be created in. If the given
        directory or subdirectories don't exist, they will be created.

   --adapt-debian-changelog

        If enabled, the `debian/changelog` is updated using `debchange`.

        The `debian/changelog` has to be updated if you want to be able to
        create deb packages out of the resulting tar archive.

        Because `debchange` is not available on every system, this switch is
        optional and the functionality is disabled by default.  But if the
        script is run on Debian or Ubuntu, the switch will automatically be
        enabled for your convenience. A proper warning is displayed.

   --push-changes

        Pushes the changes that have been made in the temporary repository
        which is used to create the tarball. This switch is meant to be used on
        a release to push changes back to the configured remote repository.
        It's configured in the git config of the given source repository.
        Those changes include the adaption of the `debian/changelog` as well as
        any git tags created.

        This switch will be ignored if the argument to --source is a local path
        which contains uncommitted changes. If there aren't uncommited changes
        to the repository, the switch won't be ignored. Be aware that every
        committed but unpushed change in the local source repository is going
        to be pushed when using this switch!

        If the push would create a new head on the remote repository, the
        changes won't be pushed and the execution of the script will be
        aborted.

   --tag

        Creates a git tag on top of other changes, like for example the
        adaption of the `debian/changelog`. The tag used will be the VERSION of
        the `version.txt` of the source.

        Due to the fact that the original source is never altered, but only a
        temporary copy of it, the tag will be lost if it isn't pushed back to
        the repository using the --push-changes switch. You should also be
        aware of the fact that the ability to add tags is supposed to be used
        on a release. This enables the automation of a release, thus it's not
        allowed to create tags which would create additional heads.

   --sign

        Cryptographically sign the resulting tarball using GPG. Creates a
        detached signature file `<tarball>.sig` in the same directory where
        the tarball has been created.
        
        Note that using this option requires a working GPG configuration.
        GPG will ask for the the secret key's passphrase, if you're not using
        something like `gpg-agent` for managing the secret key.

   --suffix=<suffix>

        If provided, the suffix will be appended to the resulting tarball
        filename as well as the directory name that the tarball contains. It
        will be appended to the basename "openattic" but before any version
        information to maintain compatibility with `debuild`.

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
import platform
import logging
import fileinput
from shutil import rmtree, copytree
from os.path import isfile, isdir
from os import makedirs
from datetime import datetime
from hashlib import md5
from docopt import docopt
from urlparse import urlparse
from distutils.spawn import find_executable

log = logging.getLogger(__name__)


def setup_logging():
    out_hdlr = logging.StreamHandler(sys.stderr)
    out_hdlr.setFormatter(logging.Formatter('%(name)s %(asctime)s %(levelname)s %(message)s'))
    out_hdlr.setLevel(logging.INFO)
    log.addHandler(out_hdlr)
    log.setLevel(logging.INFO)


def log_command(args, cwd=''):
    msg = "{} '{}'".format('' if cwd is None else cwd, "' '".join(args))
    log.info(msg)


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


def process_run(args, cwd=None, env=None, exit_on_error=True):
    log_command(args, cwd)

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
        log.debug(line)

    if pipe.stderr:
        for line in iter(pipe.stderr.readline, b''):
            tmp_result['stderr'].append(line.strip())
            sys.stderr.write(line)
            sys.stderr.flush()

    result = ProcessResult(os.linesep.join(tmp_result['stdout']),
                           os.linesep.join(tmp_result['stderr']),
                           returncode=pipe.wait())

    if not result.success() and exit_on_error:
        # Print stdout on failure too. Some tools like Webpack print errors to stdout!
        if result.stdout and log.level >= logging.DEBUG:
            # Only print stdout if already printed, otherwise we
            # want to ignore the output for being able to silence the script. Sadly some tools
            # are inconsistent with their error printing, so we need to do that here.
            log.debug('process finished: {}'.format(result.stdout))

        raise Exception('Error occurred, exiting')

    return result


def is_url(string):
    assert type(string) is str
    return urlparse(string).netloc != ''


def _command_exists(command):
    try:
        process_run(['which', command])
        return True
    except Exception:
        return False


def _rmtree(path, **kwargs):
    force = '' if 'ignore_errors' not in kwargs.keys() else 'f'
    log_command(['rm', '-r{}'.format(force), path])
    rmtree(path, **kwargs)


def _copytree(*args, **kwargs):
    log_command(['cp', '-r'] + list(args))
    copytree(*args, **kwargs)


def _check_dependencies(commands):
    """
    Fails if any command does not exist.

    :type commands: list[str]
    """
    non_exist = [c for c in commands if not _command_exists(c)]
    if non_exist:
        raise Exception('Command {} not found!'.format(non_exist))


def _get_all_tags(source_dir):
    """Retrieve all tags of the specified git source directory.

    This function returns the latest tags independent from the currently
    activated revision of the given `source_dir`.

    :param source_dir: A path to a git source directory
    :type source_dir: str
    :rtype: list[str]
    """
    process_run(['git', 'fetch'], cwd=source_dir)
    return process_run(['git', 'tag', '-l'], cwd=source_dir).stdout.splitlines()


def _get_md5_of_file(file_name):
    return md5(open(file_name, 'r').read()).hexdigest()


def _get_current_revision_hash(repo_dir=None):
    """Retrieve the hash of the current revision.

    Returns the long hash of the currently active revision of the given
    repository directory.

    :type repo_dir: str
    """
    result = process_run(['git', 'rev-parse', 'HEAD'], cwd=repo_dir)
    return result.stdout.strip()


def _commit_changes(commit_msg, repo_dir, exit_on_error=True):
    """
    :type commit_msg: str
    :type repo_dir: str
    :rtype: ProcessResult
    """
    process_run(['git', 'add', '--all'], cwd=repo_dir)
    return process_run(['git', 'commit', '-s', '-a', '-m', commit_msg],
                       cwd=repo_dir,
                       exit_on_error=exit_on_error)


def _push_changes(repo_dir):
    process_run(['git', 'push'], cwd=repo_dir)
    process_run(['git', 'push', '--tags'], cwd=repo_dir)


def _git_reset_hard(revision, cwd=None):
    for cmd in [['git', 'fetch'],
                ['git', 'checkout', revision],
                ['git', 'reset', '--hard', revision],
                ['git', 'clean', '-dfx']]:
        process_run(cmd, cwd=cwd)


def _is_debian_or_derivative():
    return platform.linux_distribution()[0].lower() in ('ubuntu', 'debian')


def adapt_debian_changelog(release_channel, version, pkgdate, revision, tarball_source_dir):
    # Provide necessary information.
    env = {'DEBEMAIL': 'info@openattic.org', 'DEBFULLNAME': 'openATTIC Build Daemon'}
    if release_channel == 'stable':
        newversion = version
        msg = 'New upstream release {}, see CHANGELOG for details'.format(version)
        distribution = 'unstable'
    else:
        newversion = version + '~' + pkgdate
        msg = 'Automatic build based on the state in Git as of %s (%s)' % (pkgdate, revision)
        distribution = 'nightly'

    # Adapt the `debian/changelog` file via `debchange`.
    process_run(
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


class DistBuilder(object):
    OA_CACHE_REPO_URL = 'https://bitbucket.org/openattic/oa_cache'
    NPM_PREFIX_EQUALS_NODE = 'prefix = ~/.node'

    def __init__(self, args=None):
        self._home_dir = os.environ['HOME']
        self._args = args if args else docopt(__doc__)

        if not self._args['--suffix']:
            self._args['--suffix'] = ''
        if self._args['--destination']:
            destination = os.path.expanduser(self._args['--destination'])
            self._destination_dir = os.path.abspath(destination)
        self._source = self._args['--source']
        if self._source == '.':
            self._source = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
        else:
            self._source = os.path.expanduser(self._source)
            self._source = os.path.abspath(self._source)
        logging.warning(self._source)
        self._tmp_dir = os.path.join(tempfile.gettempdir(), 'oa_tmp_build_dir')
        self._tmp_oa_clone_dir = os.path.join(self._tmp_dir, 'openattic')
        self._version_txt_path = os.path.join(self._tmp_oa_clone_dir, 'version.txt')
        self._package_json_path = os.path.join(self._tmp_oa_clone_dir, 'webui', 'package.json')

        if self._args['-q']:
            log.setLevel(logging.WARNING)
        elif self._args['-v']:
            log.setLevel(logging.DEBUG)
        elif self._args['-s']:
            log.setLevel(logging.ERROR)

        self._npmrc_file_path = os.path.join(self._home_dir, '.npmrc')
        self._fe_cache_dir = os.path.join(self._home_dir, '.cache', 'openattic-build', 'oa_cache')
        self._datestring = datetime.utcnow().strftime('%Y%m%d%H%M')

    def _get_version_of_revision(self, revision, update_allowed):
        """Return the version of `version.txt` using the given revision.

        It returns the VERSION of the version.txt file in the repository. The version returned
        depends on the given revision.

        :param revision: A valid git revision
        :type revision: str
        :type update_allowed: bool
        :return: The version of the `version.txt`
        :rtype: str
        """
        if update_allowed:
            # Update to the given revision before determining the upcoming version. Don't do this if
            # the source is a path, because that one is for creating tarballs to be tested before
            # releasing them.
            process_run(['git', 'checkout', revision], cwd=self._tmp_oa_clone_dir)

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

    def _remove_npmrc_prefix(self):
        """Remove the `prefix` variable from the `~/.npmrc` file."""

        with open(self._npmrc_file_path, 'r+') as npmrc:
            content = npmrc.read().split(os.linesep)
            npmrc.seek(0)
            npmrc.truncate()
            result = []
            for row in content:
                if self.NPM_PREFIX_EQUALS_NODE not in row:
                    result.append(row)
            npmrc.write(os.linesep.join(result))

    def _set_npmrc_prefix(self):
        """Enable 'npm -g install' to be used without root privileges.

        Sets the 'prefix' variable in the ~/.npmrc. Creates the file if it
        doesn't exist. It will be extended if the file does already exist.
        """

        # Extend .npmrc appropriately or create it.
        def write_npmrc(fd):
            fd.write(self.NPM_PREFIX_EQUALS_NODE + os.linesep)

        if not isfile(self._npmrc_file_path):
            with open(self._npmrc_file_path, 'w') as npmrc:
                write_npmrc(npmrc)
                log.info('File .npmrc has been created.')
        else:
            with open(self._npmrc_file_path, 'r+') as npmrc:
                if self.NPM_PREFIX_EQUALS_NODE not in npmrc.read():
                    write_npmrc(npmrc)
                    log.info('File .npmrc has been extended.')

        # Extend PATH variable.
        os.environ['PATH'] = os.environ['PATH'] + ':' + os.path.join(self._home_dir, '.node/bin')
        process_run(['bash', '-c', 'hash -r'])

    def _retrieve_source(self, source, destination_dir, skip_if_exists=False):
        """Clone or copy the sources to the specified directory.

        Skips the process if the target directory already exists. The target directory is determined
        using the target_dir argument and the basename of the source.

        :param source: The source. These may be a path or a URL.
        :type source: str
        :param destination_dir: The directory where the sources should be cloned/copied to.
        :type destination_dir: str
        """
        basedir = os.path.split(destination_dir)[0]
        if not isdir(basedir):
            makedirs(basedir)

        if isdir(destination_dir) and skip_if_exists:
            msg = 'Skipping retrieval of {} because it already exists in {}'
            log.info(msg.format(source, destination_dir))
            return

        if is_url(source):
            process_run(['git', 'clone', source, destination_dir])
        else:
            _copytree(source, destination_dir, symlinks=True)

    def _create_source_tarball(self, channel, version, suffix=''):
        """Make some necessary modifications and create the tarball.

        Remove the previous version of the current build directory, generate the frontend cache
        files if necessary, update the version.txt and create the compressed tar archive.

        :param channel: release | snapshot
        :type channel: str
        :return: The base name
        """

        # Append time stamp to version when building a snapshot
        assert channel in ('release', 'snapshot') 
        version += '~' + self._datestring if channel == 'snapshot' else ''

        # Create the base name for the given version.
        # Depending on the channel, this may either like `openattic-2.0.4` or
        # `openattic-2.0.5~201512021037`.
        build_basename = 'openattic{}-{}'.format(suffix, version)
        
        tmp_abs_build_dir = os.path.join(self._tmp_dir, build_basename)
        abs_tarball_dest_file = os.path.join(self._destination_dir, build_basename + '.tar.bz2')

        node_modules_dir = os.path.join(tmp_abs_build_dir, 'webui', 'node_modules')
        webui_dir = os.path.join(tmp_abs_build_dir, 'webui')

        # Clean up previous versions.
        if isdir(tmp_abs_build_dir):
            _rmtree(tmp_abs_build_dir)
        if isfile(abs_tarball_dest_file):
            log_command(['rm', abs_tarball_dest_file])
            os.remove(abs_tarball_dest_file)

        # /destination/path/
        # Otherwise, this command will do something different
        tmp_abs_build_dir = tmp_abs_build_dir if tmp_abs_build_dir.endswith('/') \
            else tmp_abs_build_dir + '/'
        process_run(['git', 'checkout-index', '-a', '-f', '--prefix=' + tmp_abs_build_dir],
                    cwd=self._tmp_oa_clone_dir)
        process_run(['git', 'pull'], cwd=self._fe_cache_dir)

        cache = [{
            'name': 'npm',
            'checksum_file': self._package_json_path,
            'command': ['npm', 'install'],
            'source_dir': node_modules_dir,
        }]

        cache_used = True
        for cache_entry in cache:
            if not isfile(cache_entry['checksum_file']):
                msg = "Couldn't find file %s for cache checksum. Skipping the frontend build " + \
                      "process!"
                log.warning(msg % cache_entry['checksum_file'])
                cache_used = False
                break

            md5_sum = _get_md5_of_file(cache_entry['checksum_file'])
            cache_dir = os.path.join(self._fe_cache_dir, cache_entry['name'], md5_sum)
            if not isdir(cache_dir):
                log_msg = 'No cache found for {}'
                log.info(log_msg.format(os.path.basename(cache_entry['checksum_file'])))
                process_run(cache_entry['command'], cwd=webui_dir)
                _copytree(cache_entry['source_dir'], cache_dir)  # Update cache dir.
            else:
                log_msg = 'Cache found for {}. Copying files...'
                log.info(log_msg.format(os.path.basename(cache_entry['checksum_file'])))
                _copytree(cache_dir, cache_entry['source_dir'])  # Use cache dir.

        if cache_used:  # Build the frontend files.
            process_run(['npm', 'run', 'clean'], cwd=webui_dir)  # Remove previously fetched files.
            process_run(['npm', 'run', 'build'], cwd=webui_dir)

            # Remove no longer required dirs.
            _rmtree(node_modules_dir)

        # Update version.txt.
        data = {
            'BUILDDATE': self._datestring,
            'REV': _get_current_revision_hash(self._tmp_oa_clone_dir),
            'STATE': self._get_release_channel(),
        }
        with file(os.path.join(tmp_abs_build_dir, 'version.txt'), 'a') as f:
            for key, value in data.items():
                f.write('{} = {}{}'.format(key, value, os.linesep))

        for line in fileinput.input(os.path.join(tmp_abs_build_dir, 'rpm', 'openattic.spec'), inplace=True):
            line = re.sub(r"^Version:.*", "Version: " + version, line)
            sys.stdout.write(line)

        # Compress the directory into the tarball file.
        options = 'cjf'
        options += 'v' if log.level <= logging.DEBUG else ''

        # Make sure the directory exists where the tarball should be placed into.
        abs_tarball_dest_path = os.path.split(abs_tarball_dest_file)[0]
        if not os.path.isdir(abs_tarball_dest_path):
            log_command(['mkdir', '-p', abs_tarball_dest_path])
            makedirs(abs_tarball_dest_path)

        process_run(['tar', options, abs_tarball_dest_file, build_basename],
                    cwd=self._tmp_dir)

        _rmtree(tmp_abs_build_dir)  # Remove no longer required temporary folder.

        return abs_tarball_dest_file

    def _get_release_channel(self):
        return 'release' if self._args['release'] else 'snapshot'

    def build(self):
        """
        :return: The absolute file path of the newly created tarball.
        """
        _check_dependencies(['npm'])
        self._set_npmrc_prefix()

        self._retrieve_source(DistBuilder.OA_CACHE_REPO_URL,
                              self._fe_cache_dir, skip_if_exists=True)
        process_run(['git', 'pull'], cwd=self._fe_cache_dir)

        if isdir(self._tmp_oa_clone_dir):
            _rmtree(self._tmp_oa_clone_dir)
        self._retrieve_source(self._source, self._tmp_oa_clone_dir, skip_if_exists=True)

        channel = self._get_release_channel()
        current_revision = _get_current_revision_hash()

        tmp_files_commited = False
        repo_updated = False
        try:
            _commit_changes('Testbuild', self._tmp_oa_clone_dir)
            tmp_files_commited = True
        except Exception:
            log.exception('failed to commit. Ignoring')

        if not tmp_files_commited:
            _git_reset_hard(current_revision, self._tmp_oa_clone_dir)
            repo_updated = True

        version = self._get_version_of_revision(current_revision, update_allowed=repo_updated)
        
        debchange_installed = bool(find_executable('debchange'))
        enable_debchange = False
        if self._args['--adapt-debian-changelog']:
            if debchange_installed:
                enable_debchange = True
            else:
                raise Exception('`debchange` wasn\'t found, but `--adapt-debian-changelog` has '
                                'been specified. You may either install the executable (usually in '
                                'the `devscripts` package) or deactivate the '
                                '`--adapt-debian-changelog` switch.')
        elif _is_debian_or_derivative():
            if debchange_installed:
                log.warning('The --adapt-debian-changelog switch has automatically been enabled '
                            'for you because you are using Debian or a derivative of it.')
                enable_debchange = True
            else:
                log.warning('`debchange` executable wasn\'t found. The `debian/changelog` cannot '
                            'be adapted without it. You\'ll be able to build the tar archive but '
                            'you may not be able to create a Debian package with it because of '
                            'mismatching version information.')

        if enable_debchange:
            debian_channel = 'stable' if channel == 'release' else 'nightly'
            adapt_debian_changelog(debian_channel,
                                   version + ('-1' if channel == 'release' else ''),
                                   self._datestring,
                                   current_revision,
                                   self._tmp_oa_clone_dir)
            _commit_changes('Update `debian/changelog` for release', self._tmp_oa_clone_dir)

        if self._args['--tag']:
            process_run(['git', 'tag', 'v{}-1'.format(version)], cwd=self._tmp_oa_clone_dir)

        if self._args['--push-changes']:
            # Push the changes after the tarball has successfully been created.
            if not tmp_files_commited:
                _push_changes(self._tmp_oa_clone_dir)
            else:
                log.warning('Ignoring the --push-changes switch because temporary files of the '
                            'given source have been committed.')

        abs_tarball_file_path = self._create_source_tarball(channel, version, self._args['--suffix'])

        if self._args['--sign']:
            process_run(['gpg', '--detach-sign', abs_tarball_file_path])

        _rmtree(self._tmp_oa_clone_dir)
        self._remove_npmrc_prefix()

        return abs_tarball_file_path

    def run(self):
        if self._args['help']:
            print(__doc__)
            sys.exit(0)
        elif self._args['cache'] and self._args['push']:
            _commit_changes('Update cache', self._fe_cache_dir, exit_on_error=False)
            _push_changes(self._fe_cache_dir)
        elif self._args['create']:
            abs_tarball_file_path = self.build()
            if log.level >= logging.ERROR:
                print(abs_tarball_file_path)
            else:
                print('Tarball has been created: %s' % abs_tarball_file_path)


if __name__ == '__main__':
    setup_logging()
    dist_builder = DistBuilder()
    dist_builder.run()
