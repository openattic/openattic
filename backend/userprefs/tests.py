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

