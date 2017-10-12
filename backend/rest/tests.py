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

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils.dateparse import parse_datetime


class UserTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.user = User.objects.create_user('testuser', password='secret')
        cls.user.password = 'secret'

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()

    def test_delete_logged_in_user(self):
        self.client.login(username=self.user.username, password=self.user.password)
        response = self.client.delete('/api/users/{}'.format(self.user.id))
        self.client.logout()
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['detail'], 'You can\'t delete your own user account.')

    def test_delete_another_user(self):
        user2 = User.objects.create_user('testuser2')
        self.client.login(username=self.user.username, password=self.user.password)
        response = self.client.delete('/api/users/{}'.format(user2.id))
        self.client.logout()
        self.assertEqual(response.status_code, 204)

    def test_datetime_format(self):
        self.client.login(username=self.user.username, password=self.user.password)
        response = self.client.get('/api/users/{}'.format(self.user.id))
        self.client.logout()
        self.assertIn('last_login', response.data)
        # Check if the date value has the ISO 8601 format '%Y-%m-%dT%H:%M:%S(Z|+-timezone)?'
        try:
            parsed = parse_datetime(response.data['last_login'])
        except (ValueError, TypeError):
            pass
        self.assertIsNotNone(parsed)
