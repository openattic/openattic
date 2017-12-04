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

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


class UserTest(TestCase):

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

    def test_get_current_user(self):
        response = self.client.get('/api/users/current')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], self.user.id)

    def test_create_user(self):
        userdata = {'username': 'testuser2',
                    'password': 'secret',
                    'email': 'testuser2@test.com',
                    'first_name': 'test',
                    'last_name': 'user2',
                    'is_active': True,
                    'is_superuser': True,
                    'is_staff': True}
        response = self.client.post('/api/users', data=userdata)
        self.assertEqual(response.status_code, 201)

    def test_create_auth_token(self):
        response = self.client.post('/api/users/{}/gen_new_token'.format(self.user.id))
        self.assertEqual(response.status_code, 201)
        self.assertNotEqual(response.data['auth_token']['token'], 'Not set yet!')

    def test_reset_auth_token(self):
        token = Token.objects.create(user=self.user)
        response = self.client.post('/api/users/{}/gen_new_token'.format(self.user.id))
        self.assertEqual(response.status_code, 201)
        self.assertNotEqual(token, response.data['auth_token']['token'])

    def test_get_auth_token_other_user(self):
        user2 = User.objects.create_user('testuser2', password='secret')
        Token.objects.create(user=user2)

        response = self.client.get('/api/users/{}'.format(user2.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['auth_token']['token'], '*******')

    def test_reset_auth_token_other_user(self):
        user2 = User.objects.create_user('testuser2', password='secret')
        Token.objects.create(user=user2)
        response = self.client.post('/api/users/{}/gen_new_token'.format(user2.id))
        self.assertEqual(response.status_code, 403)

    def test_update_user(self):
        updatedata = {'username': self.user.username,
                      'password': 'secret2',
                      'email': 'new_address@test.com'}
        response = self.client.put('/api/users/{}'.format(self.user.id), data=updatedata)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], updatedata['email'])

    def test_update_another_user_without_privileges(self):
        user2 = User.objects.create_user('testuser2', password='secret')
        user2.password = 'secret'

        client2 = APIClient()
        client2.login(username=user2.username, password=user2.password)

        updatedata = {'username': self.user.username,
                      'password': 'secret2',
                      'email': 'new_address@test.com'}
        response = client2.put('/api/users/{}'.format(self.user.id), data=updatedata)
        client2.logout()

        self.assertEqual(response.status_code, 403)

    def test_delete_logged_in_user(self):
        response = self.client.delete('/api/users/{}'.format(self.user.id))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['detail'], 'You can\'t delete your own user account.')

    def test_delete_another_user(self):
        user2 = User.objects.create_user('testuser2')
        response = self.client.delete('/api/users/{}'.format(user2.id))
        self.assertEqual(response.status_code, 204)

    def test_datetime_format(self):
        response = self.client.get('/api/users/{}'.format(self.user.id))
        self.assertIn('last_login', response.data)
        # Check if the date value has the ISO 8601 format '%Y-%m-%dT%H:%M:%S(Z|+-timezone)?'
        try:
            parsed = parse_datetime(response.data['last_login'])
        except (ValueError, TypeError):
            pass
        self.assertIsNotNone(parsed)
