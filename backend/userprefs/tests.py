# -*- coding: utf-8 -*-
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
from contextlib import contextmanager

from django.contrib.auth.models import User
from django.db import DataError
from django.db import transaction
from django.test import TestCase

from rest_framework.test import APIClient

from sysutils.database_utils import make_default_admin
from userprefs.models import UserProfile


class UserProfileTest(TestCase):

    @classmethod
    def setUpClass(cls):
        make_default_admin()
        cls.user = User.objects.filter(is_superuser=True).all()[0]

    @contextmanager
    def user_profile(self):
        prof = UserProfile(user=self.user)
        prof.save()
        yield prof
        prof.delete()

    def test_user_profile(self):
        with self.user_profile() as prof:
            self.assertEqual(len(prof), 0)

    def test_user_prefs(self):
        with self.user_profile() as prof:
            self.assertEqual(len(prof), 0)
            prof['a'] = {'b': 1}
            self.assertEqual(len(prof), 1)
            self.assertEqual(prof['a'], {'b': 1})

            prof['a'] = {'c': 1}
            self.assertEqual(len(prof), 1)
            self.assertEqual(prof['a'], {'c': 1})

            del prof['a']
            self.assertEqual(len(prof), 0)
            with self.assertRaises(KeyError):
                _ = prof['a']

    def test_user_prefs_in(self):
        with self.user_profile() as prof:
            self.assertNotIn('a', prof)
            prof['a'] = {'b': 1}
            self.assertIn('a', prof)

            del prof['a']
            self.assertNotIn('a', prof)

            with self.assertRaises(KeyError):
                del prof['a']

    def test_user_prefs_filter(self):
        with self.user_profile() as prof:
            prof['a'] = {'b': 1}
            prof['c'] = {'d': 1}
            self.assertEqual(unicode(prof.filter_prefs('a')), u'[<UserPreference: a>]')

    def test_user_prefs_too_long(self):
        with self.user_profile() as prof:
            with self.assertRaises(DataError):
                with transaction.atomic():
                    prof[['_'] * 51] = 0

    def test_user_prefs_iter(self):
        with self.user_profile() as prof:
            prof['a'] = {'b': 1}
            prof['c'] = {'d': 1}
            self.assertEqual([unicode(p) for p in prof],
                             ['a', 'c'])


class UserProfileRestTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.user = User.objects.create_user('testuser', password='secret')
        cls.user.password = 'secret'

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()

    def setUp(self):
        self.client = APIClient()
        self.client.login(username=self.user.username, password=self.user.password)

    def tearDown(self):
        self.client.logout()

    def test_create_profile(self):
        settings = {'setting1': 'value1', 'setting2': 'value2'}
        response = self.client.post('/api/userprofiles', data=settings)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['preferences'], settings)

    def test_get_all_profiles(self):
        UserProfile.objects.create(user=self.user)
        response = self.client.get('/api/userprofiles')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_get_profile_settings(self):
        profile = UserProfile.objects.create(user=self.user)
        profile['setting1'] = 'value1'
        profile['setting2'] = 'value2'
        profile.save()

        response = self.client.get('/api/userprofiles/{}'.format(profile.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['preferences']), 2)

    def test_get_profile_settings_other_user(self):
        user2 = User.objects.create_user('testuser2', password='secret')
        profile = UserProfile.objects.create(user=user2)
        profile['setting1'] = 'value1'
        profile['setting2'] = 'value2'
        profile.save()

        response = self.client.get('/api/userprofiles/{}'.format(profile.id))
        self.assertEqual(response.status_code, 401)

    def test_delete_profile_setting(self):
        profile = UserProfile.objects.create(user=self.user)
        profile['setting1'] = 'value1'
        profile['setting2'] = 'value2'
        profile.save()

        response = self.client.delete('/api/userprofiles/{}'.format(profile.id),
                                      data={'settings': ['setting1']}, format='json')
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(len(profile), 1)

    def test_delete_profile_setting_other_user(self):
        user2 = User.objects.create_user('testuser2', password='secret')
        profile = UserProfile.objects.create(user=user2)
        profile['setting1'] = 'value1'
        profile['setting2'] = 'value2'
        profile.save()

        response = self.client.delete('/api/userprofiles/{}'.format(profile.id),
                                      data={'settings': ['setting1']}, format='json')
        self.assertEqual(response.status_code, 401)
