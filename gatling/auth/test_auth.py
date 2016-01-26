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


class TokenAuthTestCase(TokenAuthTestScenario):

    def test_get_authtoken_by_username_and_password(self):
        """ Try to request the auth token with correct user data. """
        res = self.send_api_token_auth_request()
        self.assertIn("token", res)
        self.assertIsNotNone(res["token"])
        self.assertEqual(res["token"], self.auth_token)

    def test_get_authtoken_wrong_password(self):
        """ Try to request the auth token with a wrong password. """
        with self.assertRaises(requests.HTTPError) as err:
            self.send_api_token_auth_request(password="wrongpass")

        err_message = err.exception.response.json()
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")
        self.assertEqual(err.exception.response.status_code, 400)
        self.assertEqual(err_message["non_field_errors"][0], "Unable to log in with provided "
                                                             "credentials.")

    def test_get_authtoken_wrong_username(self):
        """ Try to request the auth token with a wrong username. """
        with self.assertRaises(requests.HTTPError) as err:
            self.send_api_token_auth_request(username="wronguser")

        err_message = err.exception.response.json()
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")
        self.assertEqual(err.exception.response.status_code, 400)
        self.assertEqual(err_message["non_field_errors"][0], "Unable to log in with provided "
                                                             "credentials.")
