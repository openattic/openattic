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
from user.scenarios import AuthTokenTestScenario


class AuthTokenTestCase(AuthTokenTestScenario, TokenAuthTestScenario):

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
        testuser_auth_token = self.send_api_token_auth_request(username=self.testuser["username"],
                                                               password=self.testuser["password"])
        res = self.send_request("GET", "users", obj_id=self.testuser["id"],
                                auth_token=testuser_auth_token["token"])
        self.assertIsNotNone(res["response"]["auth_token"]["token"])
        self.assertNotEqual(res["response"]["auth_token"]["token"], self.token_not_set_message)
        self.assertNotEqual(res["response"]["auth_token"]["token"], "*******")
        self.assertEqual(res["response"]["auth_token"]["token"], testuser_auth_token["token"])

    def test_create_refresh_auth_token_for_testuser(self):
        """ Try to refresh the auth token for testuser by default user and see if it fails. """
        # create auth token by default user
        self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"])
        with self.assertRaises(requests.HTTPError) as err:
            # try to refresh auth token by default user
            self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"])
        self.assertEqual(str(err.exception), "403 Client Error: Forbidden")
        self.assertEqual(err.exception.response.status_code, 403)
        self.assertEqual(str(err.exception.response.json()),
                         "You can't refresh the authentication token of another user. Only the "
                         "user 'gatling_testuser' is able to refresh his token.")

    def test_create_auth_token_for_testuser_and_self_refresh(self):
        """ Try to create the auth token by the default user and refresh it by the testuser. """
        # create and get auth token by api_token_auth view
        testuser_auth_token = self.send_api_token_auth_request(username=self.testuser["username"],
                                                               password=self.testuser["password"])

        # refresh auth token by testuser
        res = self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"],
                                auth_token=testuser_auth_token["token"])
        self.assertIsNotNone(res["response"]["auth_token"]["token"])
        self.assertNotEqual(res["response"]["auth_token"]["token"], self.token_not_set_message)
        self.assertNotEqual(res["response"]["auth_token"]["token"], "*******")
        self.assertNotEqual(res["response"]["auth_token"]["token"], testuser_auth_token["token"])

    def test_auth_token_self_refresh_wrong_token(self):
        """ Try to refresh the auth token of the testuser by using a not existing auth token and
            see if it fails. """
        # create and get auth token by api_token_auth view
        self.send_api_token_auth_request(username=self.testuser["username"],
                                         password=self.testuser["password"])

        with self.assertRaises(requests.HTTPError) as err:
            # try to refresh it with wrong token
            self.send_request("POST", ["users", "gen_new_token"], obj_id=self.testuser["id"],
                              auth_token="wrongauthenticationtoken")

        err_message = err.exception.response.json()
        self.assertEqual(str(err.exception), "401 Client Error: Unauthorized")
        self.assertEqual(err.exception.response.status_code, 401)
        self.assertEqual(err_message["detail"], "Invalid token")
