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
from copy import deepcopy

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
    _tables = ['auth_user', 'authtoken_token', 'userprefs_userprofile', 'userprefs_userpreference']
    _tables_without_primary_id = ['authtoken_token']

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
                self.db_content = run_in_external_process(self.get_all_users_and_prefs,
                                                          'get all users and prefs')
            except Exception:
                pass
            if self.db_content:
                with open(self.file_name, 'w') as f:
                    pickle.dump(self.db_content, f)
            else:
                self.db_content = [(table, []) for table in self._tables]

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
            migrated_host = self.migrate_from_host(self.db_content)
            for table, rows in self.migrate_dashboard_preferences(migrated_host):
                for row in rows:
                    keys, values = zip(*row.items())
                    stmt = stmt_pattern.format(table,
                                               ', '.join(keys),
                                               ', '.join(['%s'] * len(values)))
                    print 'inserting', stmt
                    cursor.execute(stmt, values)

                # Set the sequence correctly.
                if table in self._tables_without_primary_id:
                    continue

                sequence, value = fix_sequence_for_table(cursor, table)
                print('Setting sequence `{}` of table `{}` to `{}`'.format(sequence, table, value))

    @staticmethod
    def migrate_from_host(old_data):
        data = deepcopy(old_data)

        def userprefs_userprofile(elem):
            if 'host_id' in elem:
                del elem['host_id']
            return elem

        keys = [key for key, _ in data]

        index = keys.index('userprefs_userprofile')
        assert index >= 0

        data[index] = ('userprefs_userprofile', [userprefs_userprofile(elem) for elem in data[index][1]])
        if 'ifconfig_host' in keys:
            del data[keys.index('ifconfig_host')]
        return data

    @staticmethod
    def migrate_dashboard_preferences(old_data):
        data = deepcopy(old_data)

        keys = [key for key, _ in data]

        if 'userprefs_userpreference' in keys:
            index = keys.index('userprefs_userpreference')
            (_, old_settings) = data[index]

            settings = []
            for setting in old_settings:
                if setting['setting'] == 'oa_dashboard' and 'Grafana' not in setting['value']:
                    continue
                settings.append(setting)

            data[index] = ('userprefs_userpreference', settings)

        return data

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


def fix_sequence_for_table(cursor, table):
    response = execute_and_fetch(cursor, 'SELECT pg_get_serial_sequence(%s, %s)', (table, 'id'))
    if response:
        sequence = response[0]['pg_get_serial_sequence'].split('.')[1]
        stmt = "SELECT setval(%s, COALESCE((SELECT MAX(id) FROM {}) + 1, 1), false);".format(table)
        response = execute_and_fetch(cursor, stmt, (sequence,))
        return sequence, response[0]['setval']


@contextmanager
def database_cursor():
    with closing(connection.cursor()) as cursor:  # type: CursorWrapper
        try:
            yield cursor
        except Exception as e:
            # Django 1.6: There is a problem that unittest2 expects Exceptions to have a cause
            # with a traceback.
            if not hasattr(e, '__cause__'):
                e.__cause__ = None
            if e.__cause__ is not None and not hasattr(e.__cause__, '__traceback__'):
                e.__cause__.__traceback__ = None
            raise
