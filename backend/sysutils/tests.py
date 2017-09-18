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

from django.contrib.auth.models import User
from django.utils.unittest import TestCase

from rest.management import create_auth_token
from rest_client import _ResponseValidator
from sysutils.database_utils import make_default_admin, SimpleDatabaseUpgrade
from userprefs.models import UserProfile, UserPreference


class SimpleDatabaseUpgradeTestCase(TestCase):

    _old_content = [
        ('ifconfig_host', [
            {'is_oa_host': True, 'id': 1, 'name': u'hostname'}]),
        ('auth_user', [
            {'username': u'openattic', 'first_name': u'', 'last_name': u'', 'is_active': True,
             'email': u'', 'is_superuser': True, 'is_staff': True,
             'last_login': datetime.datetime(2017, 8, 24, 14, 36, 10, 906874),
             'password': u'pbkdf2_sha256$12000$8Ef1FMiwNFoX$az09mpIULEGfujbZPwevc9vgSGOd5Y1rjZd/k8vsNXs=',
             'id': 1, 'date_joined': datetime.datetime(2017, 8, 24, 14, 36, 10, 906933)}]),
        ('authtoken_token', [{'user_id': 1, 'key': u'6d4517a36d806775de9a0509fdd2f6f36d01841a',
                              'created': datetime.datetime(2017, 8, 24, 14, 36, 10, 958377)}]),
        ('userprefs_userprofile', [{'host_id': 1, 'id': 1, 'user_id': 1}]),
        ('userprefs_userpreference', [{'id': 1,
                                       'profile_id': 1,
                                       'setting': u'setting',
                                       'value': u'value'}])]

    _expected_content = [
        ('auth_user', [
            {'username': u'openattic', 'first_name': u'', 'last_name': u'', 'is_active': True,
             'email': u'', 'is_superuser': True, 'is_staff': True,
             'last_login': datetime.datetime(2017, 8, 24, 14, 36, 10, 906874),
             'password': u'pbkdf2_sha256$12000$8Ef1FMiwNFoX$az09mpIULEGfujbZPwevc9vgSGOd5Y1rjZd/k8vsNXs=',
             'id': 1, 'date_joined': datetime.datetime(2017, 8, 24, 14, 36, 10, 906933)}]),
        ('authtoken_token', [{'user_id': 1, 'key': u'6d4517a36d806775de9a0509fdd2f6f36d01841a',
                              'created': datetime.datetime(2017, 8, 24, 14, 36, 10, 958377)}]),
        ('userprefs_userprofile', [{'id': 1, 'user_id': 1}]),
        ('userprefs_userpreference', [{'id': 1,
                                       'profile_id': 1,
                                       'setting': u'setting',
                                       'value': u'value'}])]

    @classmethod
    def setUpClass(cls):
        make_default_admin()
        create_auth_token()
        profile = UserProfile(user=User.objects.all()[0])
        profile.save()
        UserPreference(profile=profile, setting='setting', value='value').save()

    def _validate_structure(self, db_content_list):
        db_content = dict(db_content_list)
        self.assertEqual(len(db_content), 4)
        for key in dict(self._expected_content):
            self.assertGreaterEqual(len(db_content[key]), 1, msg=str(key))
        _ResponseValidator.validate(
            '[*] > (username & first_name & last_name & is_active & email & last_login & password & id & date_joined)',
            db_content['auth_user'])
        _ResponseValidator.validate(
            '[*] > (user_id & key & created)',
            db_content['authtoken_token'])
        _ResponseValidator.validate(
            '[*] > (id & user_id)',
            db_content['userprefs_userprofile'])
        _ResponseValidator.validate(
            '[*] > (id & profile_id & setting & value)',
            db_content['userprefs_userpreference'])

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

    def test_migrate_remove_host(self):
        self.assertEqual(SimpleDatabaseUpgrade.migrate_from_host(self._old_content),
                         self._expected_content)
        self.assertEqual(SimpleDatabaseUpgrade.migrate_from_host(self._expected_content),
                         self._expected_content)




