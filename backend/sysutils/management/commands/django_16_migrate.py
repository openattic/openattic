# -*- coding: utf-8 -*-
"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
from contextlib import closing

import django
from django.core.management import BaseCommand
from django.db import ProgrammingError
from django.db import connection
try:
    from django.db.backends.util import CursorWrapper  # For type checking.
except ImportError:
    pass

logger = logging.getLogger(__name__)

# Look, as Django doesn't support migrations, we have either to use the outdated and deprecated
# South migrations, or delete the DB on every update, or build our own migration framework.
# This is our own migration framework. Backward Migrations will not work.
#
# To add a new migration run ./manage.py sqlmigrate <your app> <your migration> with a Django >1.6
# and paste the SQL output here. Also, build a test function that returns true, if the migration
# needs to run. Notice, not all migrations emit SQL statements, e.g ceph.0002_auto_20161007_1921
# does not.
#
# Let's hope Django 1.6 will be unsupported, before we have more than 10 migrations.


def test_ifconfig_0002_auto_20160329_1248(cursor):
    stmt = """select character_maximum_length from INFORMATION_SCHEMA.COLUMNS
              where table_name = 'ifconfig_netdevice' and column_name = 'devname';"""
    res = execute_and_fetch(cursor, stmt)
    return len(res) == 1 and res[0]['character_maximum_length'] == 10


def test_ifconfig_0003_host_is_oa_host(cursor):
    stmt = "select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = 'ifconfig_host'"
    return "is_oa_host" not in [d['column_name'] for d in execute_and_fetch(cursor, stmt)]


migrations = [
    (
        """
        BEGIN;
        ALTER TABLE "ifconfig_netdevice" ALTER COLUMN "devname" TYPE varchar(15);
        COMMIT;
        """,
        test_ifconfig_0002_auto_20160329_1248
    ),
    (
        """
        BEGIN;
        ALTER TABLE "ifconfig_host" ADD COLUMN "is_oa_host" boolean NULL;
        ALTER TABLE "ifconfig_host" ALTER COLUMN "is_oa_host" DROP DEFAULT;
        COMMIT;
        """,
        test_ifconfig_0003_host_is_oa_host
    )
]


class Command(BaseCommand):
    help = "Runs database migrations on Django 1.6"

    def handle(self, **options):
        if django.VERSION >= (1, 7):
            raise ValueError('Django 1.7+ is not supported.')
        migrate_all()


def migrate_all():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        for migration, test in migrations:
            if test(cursor):
                logger.info('Running Migration {}.'.format(test.__name__[5:]))
                cursor.execute(migration)
            else:
                logger.info('Skipping Migration {}.'.format(test.__name__[5:]))

        if any([test(cursor) for _, test in migrations]):
            raise ProgrammingError('After applying all migrations, all test '
                                   'function must return false.')


def execute_and_fetch(cursor, stmt):
    cursor.execute(stmt)
    return dictfetchall(cursor)


def dictfetchall(cursor):
    """
    Return all rows from a cursor as a dict
    Copy from: https://docs.djangoproject.com/en/1.10/topics/db/sql/#executing-custom-sql-directly
    """
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]
