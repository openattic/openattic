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
from glob import glob
from optparse import make_option

import sys
from django import VERSION
from django.core.management import BaseCommand, call_command
from django.core.management import CommandError
from django.core.management.commands import syncdb
from django.db import DEFAULT_DB_ALIAS, connection
from django.db.migrations.state import InvalidBasesError

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

    def drop_database(self):
        """
        Taken from https://github.com/django-extensions/django-extensions/blob/master/django_extensions/management/commands/reset_db.py
        """
        os.system("""bash -c "echo 'drop database openattic;' | sudo -u postgres psql" """)
        cmd = """bash -c "echo 'create database openattic OWNER openattic;' | sudo -u postgres psql" """
        os.system(cmd)

    def pre_systemd(self, drop=False, verbosity=0, **options):
        if drop:
            self.drop_database()

        call_command('pre_install')

        if VERSION[:2] >= (1, 8):
            call_command('migrate', '--fake-initial', '--noinput')
        elif VERSION[:2] == (1, 7):
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
                        self.drop_database()
                        call_command('migrate')


            finally:
                sys.stdin = old_stdin
        else:
            cmd = syncdb.Command()
            cmd.stdout = self.stdout
            cmd.stderr = self.stderr
            cmd.handle_noargs(noinput=False, verbosity=verbosity, database=DEFAULT_DB_ALIAS)
            call_command('django_16_migrate')

        call_command('loaddata', *glob('*/fixtures/initial_data.json'))
        try:
            call_command('createcachetable', 'status_cache')
        except CommandError:
            pass
        call_command('add-host')

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
