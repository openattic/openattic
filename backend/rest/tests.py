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

from rest_framework.test import APIClient


class UserTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.user = User.objects.create_user('testuser', password='secret')
        cls.user.password = 'secret'

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()

    def test_delete_logged_in_user(self):
        client = APIClient()
        client.login(username=self.user.username, password=self.user.password)
        response = client.delete('/api/users/{}'.format(self.user.id))
        client.logout()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['detail'], 'You can\'t delete your own user account.')

    def test_delete_another_user(self):
        user2 = User.objects.create_user('testuser2')

        client = APIClient()
        client.login(username=self.user.username, password=self.user.password)
        response = client.delete('/api/users/{}'.format(user2.id))
        client.logout()
        self.assertEqual(response.status_code, 204)
