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
from django.db import models

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
    if _table_exists('nagios_command', cursor):
        stmt1 = """SELECT * FROM nagios_command WHERE name in ('check_openattic_rpcd', 'check_drbd',
                   'check_twraid_unit');"""

        res1 = execute_and_fetch(cursor, stmt1)

        return bool(len(res1))
    return False


def test_sysutils_0002_delete_initscript(cursor):
    return _table_exists('sysutils_initscript', cursor)


def test_ceph_deployment_remove_CephMinion(cursor):
    return _table_exists('ceph_deployment_cephminion', cursor)


def test_nagios_remove_traditional_fixtures(cursor):
    if _table_exists('nagios_graph', cursor):
        if len(execute_and_fetch(cursor, """SELECT * FROM nagios_graph;""")):
            return True
        return len(execute_and_fetch(cursor, """SELECT * FROM nagios_command
                                                WHERE id in (8, 9, 10, 13, 14, 17, 18);"""))
    return False


def test_ceph_0005_cephpool_percent_used(cursor):
    return _column_not_exists('ceph_cephpool', 'percent_used', cursor)


def test_ceph_0006_cephosd_osd_objectstore(cursor):
    return _column_not_exists('ceph_cephosd', 'osd_objectstore', cursor)


class SqlMigration(object):

    def __init__(self, app, name, test, stmt):
        """
        :type app: str | unicode | None
        :type name: str | unicode | None
        :type test: None | (CursorWrapper) -> bool
        :type stmt: str | unicode | None
        """
        self.app = app
        self.name = name
        self.test = test
        self.stmt = stmt

    def should_run(self, django_migrations_exists, cursor):

        if self.app is None:
            return True
        if self.name is not None and (django_migrations_exists
                                 and django_migration_already_inserted(self.app, self.name, cursor)):
            logger.info('Migration already applied: {}.{}'.format(self.app, self.name))
            return False
        apps = settings.INSTALLED_APPS
        if self.app not in apps:
            logger.info('App not installed: {}.{}'.format(self.app, self.name))
            return False
        return True

    def migrate_one(self, cursor):

        if (self.test is None) != (self.stmt is None):
            raise ProgrammingError('{} != {}'.format(self.test is None, self.stmt is None))

        if self.test is not None and self.test(cursor) and self.stmt is not None:
            logger.info('Running migration {}.{}'.format(self.app, self.name))
            cursor.execute(self.stmt)
        elif self.name is None and self.test is not None and not self.test(cursor):
            logger.info('Skipping migration {}.{}'.format(self.app, self.name))
        elif self.test is not None and not self.test(cursor):
            logger.info('Skipping and inserting migration {}.{}'.format(self.app, self.name))
        elif self.test is None:
            logger.info('Faking migration {}.{}'.format(self.app, self.name))

        if self.app is not None and self.name is not None:
            insert_into_django_migrations(self.app, unicode(self.name), cursor)


def MigrationWithoutSQL(app, name):
    """
    This migration has to be inserted into the database, but has no SQL attached to it, thus it
    does not really alter the database.
    """
    return SqlMigration(app, name, None, None)


class FixLocalhostMigration(SqlMigration):
    app = 'ifconfig'
    name = '0004_fix_current_host_localhost'

    def __init__(self):
        return

    def test(self, cursor):
        stmt = """SELECT * FROM ifconfig_host WHERE name = 'localhost'"""
        return bool(len(execute_and_fetch(cursor, stmt)))

    def migrate_one(self, cursor):
        import ifconfig.models as ifconfig

        # This class needs to stay as it is for all eternity:
        class Host(models.Model):
            id = models.IntegerField(primary_key=True)
            name = models.CharField(max_length=63, unique=True)
            is_oa_host = models.NullBooleanField()

            class Meta:
                app_label = 'ifconfig'
                managed = False

        hosts = {h.name: h for h in Host.objects.filter(is_oa_host=True)}

        if not 'localhost' in hosts or ifconfig.get_host_name() in hosts:
            return

        if len(hosts) > 1:
            raise ValueError('Database inconsistency. Please flush the openATTIC database.')

        host = hosts['localhost']
        host.name = ifconfig.get_host_name()
        host.save()


# (app, name, test function, SQL statement)
# * If app and name is None, this migration will always be executed, if test function returns True.
# * If test function and SQL stmt are None, the migration will only be added to the
#   django_migrations DB table.
_migrations = [
    SqlMigration(
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
    MigrationWithoutSQL(
        'ifconfig', u'0001_initial'
    ),
    SqlMigration(
        'ifconfig', u'0002_auto_20160329_1248',
        test_ifconfig_0002_auto_20160329_1248,
        """
        BEGIN;
        ALTER TABLE "ifconfig_netdevice" ALTER COLUMN "devname" TYPE varchar(15);
        COMMIT;
        """
    ),
    SqlMigration(
        'ifconfig', u'0003_host_is_oa_host',
        test_ifconfig_0003_host_is_oa_host,
        """
        BEGIN;
        ALTER TABLE "ifconfig_host" ADD COLUMN "is_oa_host" boolean NULL;
        ALTER TABLE "ifconfig_host" ALTER COLUMN "is_oa_host" DROP DEFAULT;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph', u'0001_initial'
    ),
    MigrationWithoutSQL(
        'ceph', u'0002_auto_20161007_1921'
    ),
    MigrationWithoutSQL(
        'ceph', u'0003_allow_blanks_in_cephpool'
    ),
    MigrationWithoutSQL(
        'taskqueue', u'0001_initial'
    ),
    SqlMigration(
        'taskqueue', u'0002_taskqueue_description_textfield',
        test_taskqueue_0002_taskqueue_description_textfield,
        """
        BEGIN;
        ALTER TABLE "taskqueue_taskqueue" ALTER COLUMN "description" TYPE text;
        ALTER TABLE "taskqueue_taskqueue" ALTER COLUMN "result" TYPE text;
        COMMIT;
        """
    ),
    SqlMigration(
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
    SqlMigration(
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
    MigrationWithoutSQL(
        'sysutils', u'0001_initial'
    ),
    SqlMigration(
        'sysutils', u'0002_delete_initscript',
        test_sysutils_0002_delete_initscript,
        """
        BEGIN;
        DROP TABLE "sysutils_initscript" CASCADE;
        COMMIT;
        """
    ),
    SqlMigration(
        'ceph_deployment', u'0002_remove_CephMinion',
        test_ceph_deployment_remove_CephMinion,
        """
        BEGIN;
        ALTER TABLE "ceph_deployment_cephminion" DROP COLUMN "cluster_id" CASCADE;
        DROP TABLE "ceph_deployment_cephminion" CASCADE;
        COMMIT;
        """
    ),
    SqlMigration(
        'nagios', u'0003_remove_traditional_fixtures',
        test_nagios_remove_traditional_fixtures,
        """
        BEGIN;
        DELETE FROM nagios_graph;
        DELETE FROM nagios_service WHERE nagios_service.command_id IN (8, 9, 10, 13, 14, 17, 18);
        DELETE FROM nagios_command WHERE id in (8, 9, 10, 13, 14, 17, 18);
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph', u'0001_squashed_0004_rm_models_based_on_storageobj'
    ),
    SqlMigration(
        'volumes', u'0002_remove',
        lambda cursor: _table_exists('volumes_volumepool', cursor),
        """
        BEGIN;
        ALTER TABLE "volumes_diskdevice" DROP COLUMN "host_id" CASCADE;
        ALTER TABLE "volumes_diskdevice" DROP COLUMN "physicalblockdevice_ptr_id" CASCADE;
        ALTER TABLE "volumes_filesystemprovider" DROP COLUMN "filesystemvolume_ptr_id" CASCADE;
        ALTER TABLE "volumes_filesystemvolume" DROP COLUMN "owner_id" CASCADE;
        ALTER TABLE "volumes_filesystemvolume" DROP COLUMN "volume_type_id" CASCADE;
        ALTER TABLE "volumes_genericdisk" DROP COLUMN "disk_device_id" CASCADE;
        ALTER TABLE "volumes_physicalblockdevice" DROP COLUMN "device_type_id" CASCADE;
        ALTER TABLE "volumes_physicalblockdevice" DROP COLUMN "storageobj_id" CASCADE;
        ALTER TABLE "volumes_storageobject" DROP COLUMN "source_pool_id" CASCADE;
        ALTER TABLE "volumes_volumepool" DROP COLUMN "storageobj_id" CASCADE;
        ALTER TABLE "volumes_volumepool" DROP COLUMN "volumepool_type_id" CASCADE;
        DROP TABLE "volumes_diskdevice" CASCADE;
        DROP TABLE "volumes_filesystemprovider" CASCADE;
        DROP TABLE "volumes_filesystemvolume" CASCADE;
        DROP TABLE "volumes_physicalblockdevice" CASCADE;
        DROP TABLE "volumes_volumepool" CASCADE;

        ALTER TABLE "volumes_blockvolume" DROP COLUMN "storageobj_id" CASCADE;
        ALTER TABLE "volumes_blockvolume" DROP COLUMN "volume_type_id" CASCADE;
        ALTER TABLE "volumes_storageobject" DROP COLUMN "snapshot_id" CASCADE;
        ALTER TABLE "volumes_storageobject" DROP COLUMN "upper_id" CASCADE;

        ALTER TABLE "volumes_genericdisk" DROP COLUMN "blockvolume_ptr_id" CASCADE;
        DROP TABLE "volumes_storageobject" CASCADE;
        DROP TABLE "volumes_blockvolume" CASCADE;
        DROP TABLE IF EXISTS "volumes_genericdisk" CASCADE ;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph_iscsi', u'0001_initial'
    ),
    FixLocalhostMigration(),
    SqlMigration(
        'ceph', u'0005_cephpool_percent_used',
        test_ceph_0005_cephpool_percent_used,
        """
        BEGIN;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "percent_used" double precision NOT NULL;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph_nfs', u'0001_initial'
    ),
    SqlMigration(
        'ceph', u'0006_cephosd_osd_objectstore',
        test_ceph_0006_cephosd_osd_objectstore,
        """
        BEGIN;
        ALTER TABLE "ceph_cephosd" ADD COLUMN "osd_objectstore" varchar(15) NULL;
        ALTER TABLE "ceph_cephosd" ALTER COLUMN "osd_objectstore" DROP DEFAULT;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph', u'0007_cephpool_flags_editable'
    ),
    SqlMigration(
        'ceph', u'0008_rbd_stripe_info.py',
        lambda cursor: _column_not_exists('ceph_cephrbd', 'stripe_count', cursor),
        """
        BEGIN;
        ALTER TABLE "ceph_cephrbd" ADD COLUMN "stripe_count" integer NULL;
        ALTER TABLE "ceph_cephrbd" ALTER COLUMN "stripe_count" DROP DEFAULT;
        ALTER TABLE "ceph_cephrbd" ADD COLUMN "stripe_unit" integer NULL;
        ALTER TABLE "ceph_cephrbd" ALTER COLUMN "stripe_unit" DROP DEFAULT;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph', u'0009_cephpool_flags_default'
    ),
    MigrationWithoutSQL(
        'ceph', u'0010_remove_cephcluster_performance_data_options'
    ),
    MigrationWithoutSQL(
        'ceph', u'0011_cephrbd_features_default'
    ),
    SqlMigration(
        'ceph', u'0012_cephpool_compression',
        lambda cursor: _column_not_exists('ceph_cephosd', 'osd_objectstore', cursor),
        """
        BEGIN;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "compression_algorithm" varchar(100) NULL;
        ALTER TABLE "ceph_cephpool" ALTER COLUMN "compression_algorithm" DROP DEFAULT;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "compression_max_blob_size" integer NULL;
        ALTER TABLE "ceph_cephpool" ALTER COLUMN "compression_max_blob_size" DROP DEFAULT;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "compression_min_blob_size" integer NULL;
        ALTER TABLE "ceph_cephpool" ALTER COLUMN "compression_min_blob_size" DROP DEFAULT;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "compression_mode" varchar(100) NULL;
        ALTER TABLE "ceph_cephpool" ALTER COLUMN "compression_mode" DROP DEFAULT;
        ALTER TABLE "ceph_cephpool" ADD COLUMN "compression_required_ratio" double precision NULL;
        ALTER TABLE "ceph_cephpool" ALTER COLUMN "compression_required_ratio" DROP DEFAULT;
        COMMIT;
        """
    ),
    SqlMigration(
        'ceph', u'0013_cephcluster_add_keyring',
        lambda cursor: _column_not_exists('ceph_cephcluster', 'config_file_path', cursor),
        """
        BEGIN;
        ALTER TABLE "ceph_cephcluster" ADD COLUMN "config_file_path" varchar(1024) NULL;
        ALTER TABLE "ceph_cephcluster" ALTER COLUMN "config_file_path" DROP DEFAULT;
        ALTER TABLE "ceph_cephcluster" ADD COLUMN "keyring_file_path" varchar(1024) NULL;
        ALTER TABLE "ceph_cephcluster" ALTER COLUMN "keyring_file_path" DROP DEFAULT;
        ALTER TABLE "ceph_cephcluster" ADD COLUMN "keyring_user" varchar(1024) NULL;
        ALTER TABLE "ceph_cephcluster" ALTER COLUMN "keyring_user" DROP DEFAULT;
        COMMIT;
        """
    ),
    SqlMigration(
        'ceph', u'0014_cephrbd_data_pool',
        lambda cursor: _column_not_exists('ceph_cephrbd', 'data_pool_id', cursor),
        """
        BEGIN;
        ALTER TABLE "ceph_cephrbd" ADD COLUMN "data_pool_id" integer NULL;
        ALTER TABLE "ceph_cephrbd" ALTER COLUMN "data_pool_id" DROP DEFAULT;
        COMMIT;
        """
    ),
    SqlMigration(
        'nagios', u'0004_remove',
        lambda cursor: _table_exists('nagios_service', cursor),
        """
        BEGIN;
        ALTER TABLE "nagios_graph" DROP COLUMN "command_id" CASCADE;
        DROP TABLE "nagios_graph" CASCADE;;
        ALTER TABLE "nagios_service" DROP COLUMN "command_id" CASCADE;
        DROP TABLE "nagios_command" CASCADE;
        ALTER TABLE "nagios_service" DROP COLUMN "host_id" CASCADE;
        ALTER TABLE "nagios_service" DROP COLUMN "target_type_id" CASCADE;
        DROP TABLE "nagios_service" CASCADE;
        COMMIT;
        """
    ),
    SqlMigration(
        'ifconfig', '0005_remove_hostgroup_ipaddress_netdevice',
        lambda cursor: _table_exists('ifcoinfig_netdevice', cursor),
        """
        BEGIN;
        DROP TABLE "ifconfig_hostgroup_hosts" CASCADE;
        ALTER TABLE "ifconfig_ipaddress" DROP CONSTRAINT IF EXISTS "ifconfig_ipaddress_device_id_fkey";
        ALTER TABLE "ifconfig_ipaddress" DROP COLUMN "device_id" CASCADE;
        ALTER TABLE "ifconfig_netdevice" DROP CONSTRAINT IF EXISTS "ifconfig_netdevice_host_id_devname_key";
        DROP TABLE "ifconfig_netdevice_brports" CASCADE;
        ALTER TABLE "ifconfig_netdevice" DROP CONSTRAINT IF EXISTS "ifconfig_netdevice_host_id_fkey";
        ALTER TABLE "ifconfig_netdevice" DROP COLUMN "host_id" CASCADE;
        DROP TABLE "ifconfig_netdevice_slaves" CASCADE;
        ALTER TABLE "ifconfig_netdevice" DROP CONSTRAINT IF EXISTS "ifconfig_netdevice_vlanrawdev_id_fkey";
        ALTER TABLE "ifconfig_netdevice" DROP COLUMN "vlanrawdev_id" CASCADE;
        DROP TABLE "ifconfig_hostgroup" CASCADE;
        DROP TABLE "ifconfig_ipaddress" CASCADE;
        DROP TABLE "ifconfig_netdevice" CASCADE;
        COMMIT;
        """
    ),
    MigrationWithoutSQL(
        'ceph', u'0015_cephpool_application_metadata'
    ),
    MigrationWithoutSQL(
        'ceph', u'0016_cephcluster_osd_flags'
    ),
]


class Command(BaseCommand):
    help = "Runs database migrations on Django 1.6"

    def handle(self, **options):
        if django.VERSION >= (1, 7):
            raise ValueError('Django 1.7 (or newer) is not supported.')
        migrate_all()



def get_migrations(cursor):
    django_migrations_exists = _table_exists('django_migrations', cursor)

    return [migration for migration in _migrations if
            migration.should_run(django_migrations_exists, cursor)]


def migrate_all():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        migrations = get_migrations(cursor)
        for migration in migrations:
            migration.migrate_one(cursor)

        if any([migration.test is not None and migration.test(cursor) for migration in migrations]):
            raise ProgrammingError('After applying all migrations, all test '
                                   'functions must return false.')


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


def _column_not_exists(table_name, column_name, cursor):
    stmt = """SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS
              WHERE table_name = %s;"""
    res = execute_and_fetch(cursor, stmt, [table_name])
    return column_name not in [d['column_name'] for d in res]
