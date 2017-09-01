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
import os
import pickle
from contextlib import contextmanager, closing
import logging

from django.conf import settings
from django.contrib.auth.models import User
from django.db import connection

from utilities import run_in_external_process

try:
    from django.db.backends.util import CursorWrapper  # For type checking.
except ImportError:
    pass

logger = logging.getLogger(__name__)


class SimpleDatabaseUpgrade(object):
    _file_name = '/tmp/openattic-upgrade-backup-data'
    _tables = ['ifconfig_host', 'auth_user', 'authtoken_token', 'userprefs_userprofile',
                  'userprefs_userpreference']

    def __init__(self, file_name=None):
        self.file_name = self._file_name if file_name is None else file_name
        self.db_content = [(table, []) for table in self._tables]
        """:type: list[tuple[str, list[dict]]]"""

    def read_from_file(self):
        with open(self.file_name) as f:
            return pickle.load(f)

    def load(self):
        try:
            self.db_content = self.read_from_file()
        except Exception:
            try:
                self.db_content = run_in_external_process(self.get_all_users_and_prefs)
            except Exception:
                pass
            if self.db_content:
                with open(self.file_name, 'w') as f:
                    pickle.dump(self.db_content, f)
            else:
                self.db_content = [(table, []) for table in self._tables]

        assert self.db_content[0][0] == 'ifconfig_host'
        if 'is_oa_host' not in self.db_content[0][1]:
            for host in self.db_content[0][1]:
                host['is_oa_host'] = True

    def insert(self):
        try:
            self.insert_all_users_and_prefs()
        except Exception:
            logger.exception('insert failed')
        try:
            os.remove(self.file_name)
        except Exception:
            pass


    @classmethod
    def get_all_users_and_prefs(cls):
        """:rtype: list[tuple[str, list[dict]]] | None"""

        try:
            stmt = """SELECT * FROM {};"""
            with database_cursor() as cursor:
                return [(table, execute_and_fetch(cursor, stmt.format(table))) for table in
                        cls._tables]
        except Exception:
            return None

    def insert_all_users_and_prefs(self):
        stmt_pattern = """INSERT INTO {} ({}) VALUES ({});"""
        with database_cursor() as cursor:
            for table, rows in self.db_content:
                for row in rows:
                    keys, values = zip(*row.items())
                    stmt = stmt_pattern.format(table,
                                               ', '.join(keys),
                                               ', '.join(['%s'] * len(values)))
                    print 'inserting', stmt
                    cursor.execute(stmt, values)

def make_default_admin():
    if User.objects.filter(is_superuser=True).count() == 0:
        oa_username = getattr(settings, "OAUSER")
        admin = User(username=oa_username, is_superuser=True, is_staff=True, is_active=True)
        admin.set_password('openattic')
        admin.save()
        print('Created default user "openattic" with password "openattic".')
    else:
        print('We have an admin already, not creating default user.')


def execute_and_fetch(cursor, stmt, args=None):
    cursor.execute(stmt, args)
    return fetch_all_dict(cursor)


def fetch_all_dict(cursor):
    """
    Return all rows from a cursor as a dict
    Copy from: https://docs.djangoproject.com/en/1.10/topics/db/sql/#executing-custom-sql-directly
    """
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

@contextmanager
def database_cursor():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        yield cursor
