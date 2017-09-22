"""
 *   Copyright (c) 2017 SUSE LLC
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
import logging

import StringIO
import os
from subprocess import check_call
from optparse import make_option

import sys
from django import VERSION
from django.core.management import BaseCommand, call_command
from django.core.management import CommandError
from django.core.management.commands import syncdb
from django.db import DEFAULT_DB_ALIAS

try:
    from django.db.backends.util import CursorWrapper  # For type checking.
except ImportError:
    pass

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Implements DB stuff of `oaconfig install`'

    option_list = BaseCommand.option_list + (
        make_option('--drop',
                    help='Drops and creates Database.',
                    action='store_true'
                    ),
        make_option('--pre-install',
                    help='Run post_install (needs openattic-systemd).',
                    action='store_true'
                    ),
        make_option('--post-install',
                    help='Run post_install (needs openattic-systemd).',
                    action='store_true'
                    ),

    )

    def pre_systemd(self, drop=False, verbosity=0, **options):
        if drop:
            drop_database()

        try:
            call_command('pre_install')
        except ImportError:
            print 'you may need to remove all .pyc files.'
            raise

        if VERSION[:2] >= (1, 8):
            call_command('migrate', '--fake-initial', '--noinput')
        elif VERSION[:2] == (1, 7):
            from django.db.migrations.state import InvalidBasesError
            old_stdin = sys.stdin
            try:
                # "no" is the answer to
                #
                # > The following content types are stale and need to be deleted:
                # > ...
                # > Any objects related to these content types by a foreign key will also
                # > be deleted. Are you sure you want to delete these content types?
                # > If you're unsure, answer 'no'.
                #
                # In Django 1.7, content types is buggy. We cannot delete them.
                sys.stdin = StringIO.StringIO('no')
                try:
                    call_command('migrate')
                except InvalidBasesError:
                    logger.exception("Got an exception while running `migrate`. Trying again.")
                    # Django 1.7 needs a second try applying ceph.0004_rm_models_based_on_storageobj
                    try:
                        call_command('migrate')
                    except InvalidBasesError:
                        logger.exception("Giving up. Will now DROP DATABASE.")
                        if drop:
                            raise
                        drop_database()
                        call_command('migrate')


            finally:
                sys.stdin = old_stdin

        else:
            from sysutils.database_utils import SimpleDatabaseUpgrade

            def call_command_syncdb():
                cmd = syncdb.Command()
                cmd.stdout = self.stdout
                cmd.stderr = self.stderr
                cmd.handle_noargs(noinput=False, verbosity=verbosity, database=DEFAULT_DB_ALIAS)

            db_contents = SimpleDatabaseUpgrade()
            if not drop:
                db_contents.load()
                drop_database()

            call_command_syncdb()

            db_contents.insert()

    def post_install(self, **options):
        call_command('makedefaultadmin')
        call_command('post_install')

    def handle(self, pre_install=False, post_install=False, **options):
        if not pre_install and not post_install:
            raise CommandError("Either --pre-install or --post-install is required.")
        if pre_install:
            self.pre_systemd(**options)
        if post_install:
            self.post_install(**options)


def drop_database():
    """
    Taken from https://github.com/django-extensions/django-extensions/blob/master/django_extensions/management/commands/reset_db.py
    """
    check_call(
        ['su', '-', 'postgres', '-c', "echo 'drop database openattic;' | psql"])
    cmd = ['su', '-', 'postgres', '-c',
           "echo 'create database openattic OWNER openattic;' | psql"]
    check_call(cmd)
