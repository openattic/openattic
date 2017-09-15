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
import datetime
import os

import pickle
from django.utils.unittest import TestCase

from ifconfig.models import Host
from rest.management import create_auth_token
from rest_client import _ResponseValidator
from sysutils.database_utils import make_default_admin, SimpleDatabaseUpgrade


class SimpleDatabaseUpgradeTestCase(TestCase):

    _expected_content = [
        ('ifconfig_host', [
            {'is_oa_host': True, 'id': 1, 'name': u'ThinkPad-von-sebastian'}]),
        ('auth_user', [
            {'username': u'openattic', 'first_name': u'', 'last_name': u'', 'is_active': True,
             'email': u'', 'is_superuser': True, 'is_staff': True,
             'last_login': datetime.datetime(2017, 8, 24, 14, 36, 10, 906874),
             'password': u'pbkdf2_sha256$12000$8Ef1FMiwNFoX$az09mpIULEGfujbZPwevc9vgSGOd5Y1rjZd/k8vsNXs=',
             'id': 1, 'date_joined': datetime.datetime(2017, 8, 24, 14, 36, 10, 906933)}]),
        ('authtoken_token', [{'user_id': 1, 'key': u'6d4517a36d806775de9a0509fdd2f6f36d01841a',
                              'created': datetime.datetime(2017, 8, 24, 14, 36, 10, 958377)}]),
        ('userprefs_userprofile', []),
        ('userprefs_userpreference', [])]

    @classmethod
    def setUpClass(cls):
        Host.objects.get_current()
        make_default_admin()
        create_auth_token()

    def _validate_structure(self, db_content_list):
        db_content = dict(db_content_list)
        self.assertEqual(len(db_content), 5)
        _ResponseValidator.validate('[*] > (is_oa_host & id & name)', db_content['ifconfig_host'])
        _ResponseValidator.validate(
            '[*] > (username & first_name & last_name & is_active & email & last_login & password & id & date_joined)',
            db_content['auth_user'])
        _ResponseValidator.validate(
            '[*] > (user_id & key & created)',
            db_content['authtoken_token'])

    def test_get_all_users_and_prefs(self):
        db_content = SimpleDatabaseUpgrade.get_all_users_and_prefs()
        self._validate_structure(db_content)

    def test_load(self):
        u1 = SimpleDatabaseUpgrade()
        try:
            os.remove(u1.file_name)
        except OSError:
            pass
        u1.load()
        with open(u1.file_name) as f:
            self.assertEqual(u1.db_content, pickle.load(f))
        self._validate_structure(u1.db_content)

        with open(u1.file_name, 'wb') as f:
            pickle.dump(self._expected_content, f)

        u2 = SimpleDatabaseUpgrade()
        u2.load()
        with open(u2.file_name) as f:
            self.assertEqual(u2.db_content, self._expected_content)
        self._validate_structure(u2.db_content)
        os.remove(u2.file_name)




