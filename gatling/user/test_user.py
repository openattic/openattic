# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import requests

from auth.scenarios import TokenAuthTestScenario
from user.scenarios import UserTestScenario


class AuthTokenTestCase(UserTestScenario, TokenAuthTestScenario):

    token_not_set_message = "Not set yet!"

    def test_get_auth_token_field_of_testuser(self):
        """ Checks if the 'auth_token' and 'token' fields are could be found for a user. """
        self.assertIn("auth_token", self.testuser)
        self.assertIn("token", self.testuser["auth_token"])

    def test_create_auth_token_for_testuser_by_default_user(self):
        """ Try to create an auth token for a user by the default user. """
        self.assertEqual(self.testuser["auth_token"]["token"], self.token_not_set_message)

        # create auth token by default user
        res = self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"])
        self.assertIsNotNone(res["response"]["auth_token"]["token"])
        self.assertNotEqual(res["response"]["auth_token"]["token"], self.token_not_set_message)
        self.assertEqual(res["response"]["auth_token"]["token"], "*******")

    def test_create_auth_token_for_testuser_by_api_token_auth_view(self):
        """ Try to to create an auth token for testuser by the api-token-auth view. """
        self.assertEqual(self.testuser["auth_token"]["token"], self.token_not_set_message)

        # create and get auth token by api_token_auth view
        testuser_auth_token = self.get_auth_token(username=self.testuser["username"],
                                                  password=self.testuser["password"])
        res = self.send_request("GET", "users", obj_id=self.testuser["id"],
                                auth_token=testuser_auth_token)
        self.assertIsNotNone(res["response"]["auth_token"]["token"])
        self.assertNotEqual(res["response"]["auth_token"]["token"], self.token_not_set_message)
        self.assertNotEqual(res["response"]["auth_token"]["token"], "*******")
        self.assertEqual(res["response"]["auth_token"]["token"], testuser_auth_token)

    def test_create_refresh_auth_token_for_testuser(self):
        """ Try to refresh the auth token for testuser by default user and see if it fails. """
        # create auth token by default user
        self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"])
        with self.assertRaises(requests.HTTPError) as err:
            # try to refresh auth token by default user
            self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"])

        self.check_exception_messages(
            err, self.error_messages['test_create_refresh_auth_token_for_testuser'],
            status_code=403)

    def test_create_auth_token_for_testuser_and_self_refresh(self):
        """ Try to create the auth token by the default user and refresh it by the testuser. """
        # create and get auth token by api_token_auth view
        testuser_auth_token = self.get_auth_token(username=self.testuser["username"],
                                                  password=self.testuser["password"])

        # refresh auth token by testuser
        res = self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"],
                                auth_token=testuser_auth_token)
        self.assertIsNotNone(res["response"]["auth_token"]["token"])
        self.assertNotEqual(res["response"]["auth_token"]["token"], self.token_not_set_message)
        self.assertNotEqual(res["response"]["auth_token"]["token"], "*******")
        self.assertNotEqual(res["response"]["auth_token"]["token"], testuser_auth_token)

    def test_auth_token_self_refresh_wrong_token(self):
        """ Try to refresh the auth token of the testuser by using a not existing auth token and
            see if it fails. """
        # create and get auth token by api_token_auth view
        self.get_auth_token(username=self.testuser["username"],
                            password=self.testuser["password"])

        with self.assertRaises(requests.HTTPError) as err:
            # try to refresh it with wrong token
            self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"],
                              auth_token="wrongauthenticationtoken")

        self.check_exception_messages(
            err, self.error_messages['test_auth_token_self_refresh_wrong_token'], status_code=401)


class UserManagementTestCase(UserTestScenario):

    def test_password_must_not_be_returned(self):
        """ Check if password is not included in the user response object. """
        res = self.send_request('GET', 'users', username=self.testuser['username'],
                                password=self.testuser['password'], obj_id=self.testuser['id'])
        self.assertNotIn('password', res['response'])

    def test_set_new_password_for_own_user(self):
        """ Try to refresh the password of the current testuser. """
        # try to get the user list with the current password
        self.send_request('GET', 'users', username=self.testuser['username'],
                          password=self.testuser['password'])

        # reset the password of the current testuser
        initial_pass = self.testuser['password']
        self.testuser['password'] = 'new_pass'
        self.send_request('PUT', 'users', username=self.testuser['username'], password=initial_pass,
                          obj_id=self.testuser['id'], data=self.testuser)

        # try to get the user list with the new password
        self.send_request('GET', 'users', username=self.testuser['username'],
                          password=self.testuser['password'])

    def test_set_new_password_for_other_user_by_admin_user(self):
        """ Try to refresh the password of an user by an adminitrator. """
        # create a second test user
        self._delete_user('testuser_2')

        testuser_2 = self._create_test_user('testuser_2')
        self.addCleanup(requests.request, 'DELETE', testuser_2['cleanup_url'],
                        headers=testuser_2['headers'])
        testuser_2 = testuser_2['response']

        # reset the password of the second test user by 'testuser'
        testuser_2['password'] = 'new_pass'
        self.send_request('PUT', 'users', username=self.testuser['username'],
                          password=self.testuser['password'], obj_id=testuser_2['id'],
                          data=testuser_2)

        # try to get the user list by 'testuser_2' using the new password
        self.send_request('GET', 'users', username=testuser_2['username'],
                          password=testuser_2['password'])

    def test_set_new_password_by_user_without_admin_privileges(self):
        """ Try to refresh the password on an user by another user how is not an administrator. """
        # create the second test user (without administrator privileges)
        self._delete_user('testuser_2')

        testuser_2 = self._create_test_user('testuser_2', False)
        self.addCleanup(requests.request, 'DELETE', testuser_2['cleanup_url'],
                        headers=testuser_2['headers'])
        testuser_2 = testuser_2['response']

        # try to reset the password of the default user 'gatling_testuser'
        old_pass = self.testuser['password']
        self.testuser['password'] = 'new_pass'
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request('PUT', 'users', username=testuser_2['username'],
                              password=testuser_2['password'], obj_id=self.testuser['id'],
                              data=self.testuser)

        self.check_exception_messages(
            err, self.error_messages['test_set_new_password_by_user_without_admin_privileges'],
            status_code=403)

        # try to get the user list by default user 'gatling_testuser' using the old password
        self.send_request('GET', 'users', username=self.testuser['username'], password=old_pass)
