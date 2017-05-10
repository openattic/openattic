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
from django.conf import settings
from django.core.management import BaseCommand
from django.db import ProgrammingError
from django.db import connection
try:
    from django.db.backends.util import CursorWrapper  # For type checking.
except ImportError:
    pass

logger = logging.getLogger(__name__)

# As Django 1.6 doesn't support migrations, we either have to use the outdated and deprecated
# South migrations, or delete the DB on every update, or build our own migration framework.
# This is our own migration framework. Backward migrations will not work.
#
# To add a new migration run ./manage.py sqlmigrate <your app> <your migration> with a Django >1.6
# and paste the SQL output here. Also, build a test function that returns true, if the migration
# needs to run. Notice, not all migrations emit SQL statements, e.g ceph.0002_auto_20161007_1921
# does not.
#
# Let's hope Django 1.6 will be unsupported, before we have more than 10 migrations.
#
# Unfortunately, this got a bit more complicated than anticipated, because these migrations need
# to be detected by future Django versions.
#
# Here are some important rules:
# * If you add a new app here, make sure to fake the initial migration by adding a migration
#   without SQL stmt.
# * The result must be compatible to Django 1.7+ migrations.
# * Don't add initial migrations, until you need a second one.
# * Include all migrations, even migrations without SQL statements. Otherwise, the Django 1.7+
#   migration framework may not work as expected.
# * The order of migrations must be valid, according to migration dependencies.
# * We still need to add a test function, in order to cope with db tables created by syncdb, which
#   are newer than the initial table schema. This is a main reason for this complexity here.


def test_ifconfig_0002_auto_20160329_1248(cursor):
    stmt = """SELECT character_maximum_length FROM INFORMATION_SCHEMA.COLUMNS
              WHERE table_name = 'ifconfig_netdevice' AND column_name = 'devname';"""
    res = execute_and_fetch(cursor, stmt)
    return len(res) == 1 and res[0]['character_maximum_length'] == 10


def test_ifconfig_0003_host_is_oa_host(cursor):
    stmt = "SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'ifconfig_host'"
    return "is_oa_host" not in [d['column_name'] for d in execute_and_fetch(cursor, stmt)]


def test_taskqueue_0002_taskqueue_description_textfield(cursor):
    stmt = """SELECT data_type FROM INFORMATION_SCHEMA.COLUMNS
              WHERE table_name = 'taskqueue_taskqueue' AND column_name = 'description';"""
    res = execute_and_fetch(cursor, stmt)
    return len(res) == 1 and res[0]['data_type'] != 'text'


def test_0002_auto_20170126_1628(cursor):
    stmt1 = """SELECT * FROM nagios_command WHERE name in ('check_openattic_rpcd', 'check_drbd',
               'check_twraid_unit');"""
    stmt2 = """SELECT * FROM sysutils_initscript WHERE name = 'openattic_rpcd';"""

    res1 = execute_and_fetch(cursor, stmt1)
    res2 = execute_and_fetch(cursor, stmt2)

    return (len(res1) or len(res2)) != 0


def test_sysutils_0002_delete_initscript(cursor):
    return _table_exists('sysutils_initscript', cursor)


# (app, name, test function, SQL statement)
# * If app and name is None, this migration will always be executed, if test function returns True.
# * If test function and SQL stmt are None, the migration will only be added to the
#   django_migrations DB table.
_migrations = [
    (
        None, None,
        lambda cursor: not _table_exists('django_migrations', cursor),
        """
        CREATE TABLE "django_migrations"
        (
            "id" serial NOT NULL PRIMARY KEY,
            "app" varchar(255) NOT NULL,
            "name" varchar(255) NOT NULL,
            "applied" timestamp with time zone NOT NULL
        );
        """
    ),
    (
        'ifconfig', u'0001_initial', None, None
    ),
    (
        'ifconfig', u'0002_auto_20160329_1248',
        test_ifconfig_0002_auto_20160329_1248,
        """
        BEGIN;
        ALTER TABLE "ifconfig_netdevice" ALTER COLUMN "devname" TYPE varchar(15);
        COMMIT;
        """
    ),
    (
        'ifconfig', u'0003_host_is_oa_host',
        test_ifconfig_0003_host_is_oa_host,
        """
        BEGIN;
        ALTER TABLE "ifconfig_host" ADD COLUMN "is_oa_host" boolean NULL;
        ALTER TABLE "ifconfig_host" ALTER COLUMN "is_oa_host" DROP DEFAULT;
        COMMIT;
        """
    ),
    (
        'ceph', u'0001_initial', None, None
    ),
    (
        'ceph', u'0002_auto_20161007_1921', None, None
    ),
    (
        'ceph', u'0003_allow_blanks_in_cephpool', None, None
    ),
    (
        'taskqueue', u'0001_initial', None, None
    ),
    (
        'taskqueue', u'0002_taskqueue_description_textfield',
        test_taskqueue_0002_taskqueue_description_textfield,
        """
        BEGIN;
        ALTER TABLE "taskqueue_taskqueue" ALTER COLUMN "description" TYPE text;
        ALTER TABLE "taskqueue_taskqueue" ALTER COLUMN "result" TYPE text;
        COMMIT;
        """
    ),
    (
        'nagios', u'0002_auto_20170126_1628',
        test_0002_auto_20170126_1628,
        """
        BEGIN;
        DELETE FROM nagios_service WHERE description = 'openATTIC RPCd';
        DELETE FROM nagios_command WHERE name in ('check_openattic_rpcd','check_drbd',
        'check_twraid_unit');
        DELETE FROM sysutils_initscript WHERE name = 'openattic_rpcd';
        COMMIT;
        """
    ),
    (
        'ceph', u'0004_rm_models_based_on_storageobj',
        lambda cursor: _table_exists('ceph_osd', cursor),
        """
        BEGIN;
        ALTER TABLE "ceph_cluster" DROP COLUMN "storageobject_ptr_id" CASCADE;
        ALTER TABLE "ceph_entity" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_image" DROP COLUMN "blockvolume_ptr_id" CASCADE;
        ALTER TABLE "ceph_image" DROP COLUMN "rbd_pool_id" CASCADE;
        ALTER TABLE "ceph_mds" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_mds" DROP COLUMN "host_id" CASCADE;
        ALTER TABLE "ceph_mon" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_mon" DROP COLUMN "host_id" CASCADE;
        ALTER TABLE "ceph_osd" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_osd" DROP COLUMN "journal_id" CASCADE;
        ALTER TABLE "ceph_osd" DROP COLUMN "volume_id" CASCADE;
        ALTER TABLE "ceph_pool" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_pool" DROP COLUMN "volumepool_ptr_id" CASCADE;
        DROP TABLE "ceph_entity" CASCADE;
        DROP TABLE "ceph_image" CASCADE;
        DROP TABLE "ceph_mds" CASCADE;
        DROP TABLE "ceph_mon" CASCADE;
        DROP TABLE "ceph_osd" CASCADE;
        DROP TABLE "ceph_pool" CASCADE;
        ALTER TABLE "ceph_crushmapversion" DROP COLUMN "author_id" CASCADE;
        ALTER TABLE "ceph_crushmapversion" DROP COLUMN "cluster_id" CASCADE;
        ALTER TABLE "ceph_crushmapversion" DROP COLUMN "created_at" CASCADE;
        ALTER TABLE "ceph_crushmapversion" DROP COLUMN "edited_at" CASCADE;
        ALTER TABLE "ceph_crushmapversion" DROP COLUMN "epoch" CASCADE;
        DROP TABLE "ceph_cluster" CASCADE;
        """
    ),
    (
        'sysutils', u'0001_initial', None, None
    ),
    (
        'sysutils', u'0002_delete_initscript',
        test_sysutils_0002_delete_initscript,
        """
        BEGIN;
        DROP TABLE "sysutils_initscript" CASCADE;
        COMMIT;
        """
    )
]


class Command(BaseCommand):
    help = "Runs database migrations on Django 1.6"

    def handle(self, **options):
        if django.VERSION >= (1, 7):
            raise ValueError('Django 1.7 (or newer) is not supported.')
        migrate_all()


def get_migrations(cursor):
    django_migrations_exists = _table_exists('django_migrations', cursor)

    def should_run(migration):

        app, name, test, stmt = migration
        if app is None:
            return True
        if name is not None and (django_migrations_exists
                                 and django_migration_already_inserted(app, name, cursor)):
            logger.info('Migration already applied: {}.{}'.format(app, name))
            return False
        apps = settings.INSTALLED_APPS
        if app not in apps:
            logger.info('App not installed: {}.{}'.format(app, name))
            return False
        return True

    return filter(should_run, _migrations)


def migrate_all():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        migrations = get_migrations(cursor)
        for migration in migrations:
            migrate_one(migration, cursor)

        if any([test is not None and test(cursor) for _, _, test, _ in migrations]):
            raise ProgrammingError('After applying all migrations, all test '
                                   'functions must return false.')


def migrate_one(migration, cursor):
    app, name, test, stmt = migration
    if (test is None) != (stmt is None):
        raise ProgrammingError('{} != {}'.format(test is None, stmt is None))

    if test is not None and test(cursor) and stmt is not None:
        logger.info('Running migration {}.{}'.format(app, name))
        cursor.execute(stmt)
    elif name is None and test is not None and not test(cursor):
        logger.info('Skipping migration {}.{}'.format(app, name))
    elif test is not None and not test(cursor):
        logger.info('Skipping and inserting migration {}.{}'.format(app, name))
    elif test is None:
        logger.info('Faking migration {}.{}'.format(app, name))

    if app is not None and name is not None:
        insert_into_django_migrations(app, unicode(name), cursor)


def insert_into_django_migrations(app, name, cursor):
    stmt = """INSERT INTO "django_migrations" ("app", "name", "applied")
              VALUES (%s, %s, now())"""
    cursor.execute(stmt, [app, name])


def django_migration_already_inserted(app, name, cursor):
    stmt = """SELECT * FROM "django_migrations"
              WHERE app = %s AND name = %s"""
    return len(execute_and_fetch(cursor, stmt, [app, name])) == 1


def execute_and_fetch(cursor, stmt, args=None):
    cursor.execute(stmt, args)
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


def _table_exists(table_name, cursor):
    stmt = """SELECT table_name FROM INFORMATION_SCHEMA.COLUMNS
              WHERE table_name = %s;"""
    res = execute_and_fetch(cursor, stmt, [table_name])
    return len(res) > 0 and res[0]['table_name'] == table_name
