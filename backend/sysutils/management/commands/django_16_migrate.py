from contextlib import closing

import django
from django.core.management import BaseCommand
from django.db import connection
from django.db.backends.util import CursorWrapper  # For type checking.


def test_0003_host_is_oa_host(cursor):
    stmt = "select column_name from INFORMATION_SCHEMA.COLUMNS where table_name = 'ifconfig_host'"
    return "is_oa_host" not in execute_sql(cursor, stmt)


migrations = [
    (
        """BEGIN;
ALTER TABLE "ifconfig_host" ADD COLUMN "is_oa_host" boolean NULL;
ALTER TABLE "ifconfig_host" ALTER COLUMN "is_oa_host" DROP DEFAULT;
COMMIT;""",
        test_0003_host_is_oa_host
    )
]


class Command(BaseCommand):
    help = "Runs custom Migrations for Django 1.6"

    def handle(self, **options):
        if django.VERSION >= (1, 7):
            raise ValueError('Django 1.7+ is not supported here.')
        migrate_all()


def migrate_all():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        for migration, test in migrations:
            if test(cursor):
                cursor.execute(migration)


def execute_sql(cursor, stmt):
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
