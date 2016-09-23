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
import json

from user.scenarios import UserTestScenario


class UserPrefsTestCase(UserTestScenario):

    test_preference = {
        "gatling_preference": {
            "setting1": "value1",
            "setting2": "value2",
        }
    }

    test_preference_overwrite = {
        "gatling_preference": {
            "setting_overwrite": "value1_overwrite"
        }
    }

    api_prefix = "userprofiles"

    def test_create_userpreference(self):
        """ Try to create a user preference and check if it's stored in the database and returned by
        the REST API. """
        profile = self.send_request("GET")
        pre_length = len(profile["response"][0]["preferences"]) if profile["response"] else 0

        # Create a preference
        res = self.send_request("POST", data=self.test_preference)
        self.addCleanup(requests.delete, res["cleanup_url"], headers=res["headers"],
                        data=json.dumps({"settings": [self.test_preference.keys()[0]]}))

        # Check if profile was added
        self.assertEqual(len(res["response"]["preferences"]), pre_length + 1)
        self.assertIn(self.test_preference.keys()[0], res["response"]["preferences"])

    def test_create_delete_userpreference(self):
        """ Try to create a user preference and check if it is deleted correctly. """
        profile = self.send_request("GET")
        pre_length = len(profile["response"][0]["preferences"]) if profile["response"] else 0

        # Create and delete a preference
        res = self.send_request("POST", data=self.test_preference)
        self.send_request("DELETE", obj_id=res["response"]["id"], headers=res["headers"],
                          data={"settings": [self.test_preference.keys()[0]]})

        # Check if it is deleted
        profile = self.send_request("GET")
        self.assertEqual(len(profile["response"][0]["preferences"]), pre_length)
        self.assertNotIn(self.test_preference.keys()[0], profile["response"][0]["preferences"])

    def test_overwrite_setting_by_adding_same_key_again(self):
        """ Try to overwrite a setting by adding the same key again. """
        # Create a preference
        self.send_request("POST", data=self.test_preference)

        # Overwrite preference
        res = self.send_request("POST", data=self.test_preference_overwrite)
        self.addCleanup(requests.delete, res["cleanup_url"], headers=res["headers"],
                        data=json.dumps({"settings": [self.test_preference.keys()[0]]}))

        # Check if preference is overwritten
        preference = res["response"]["preferences"]
        preference_key = self.test_preference_overwrite.keys()[0]
        setting_key = self.test_preference_overwrite[preference_key].keys()[0]

        self.assertIn(preference_key, preference)
        self.assertEqual(len(preference[preference_key]), 1)
        self.assertIn(setting_key, preference[preference_key])

    def test_try_to_get_preference_of_another_user(self):
        """ Try to get a preference of another user and see if it fails. """
        # Create authtoken for testuser
        testuser_auth_token = self.get_auth_token(username=self.testuser["username"],
                                                  password=self.testuser["password"])

        # Get profile of the default user
        profile = self.send_request("GET")

        # Try to get this profile by the testuser
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("GET", obj_id=profile["response"][0]["id"],
                              auth_token=testuser_auth_token)
        self.assertEqual(err.exception.response.status_code, 401)
        self.assertEqual(str(err.exception.response.json()), "You are not allowed to access other "
                                                             "users profiles")

    def test_try_to_delete_preference_of_another_user(self):
        """ Try to delete a preference for another user and see if it fails. """
        # Create authtoken for testuser
        testuser_auth_token = self.get_auth_token(username=self.testuser["username"],
                                                  password=self.testuser["password"])

        # Create a preference
        res = self.send_request("POST", data=self.test_preference)
        self.addCleanup(requests.delete, res["cleanup_url"], headers=res["headers"],
                        data=json.dumps({"settings": [self.test_preference.keys()[0]]}))

        # Try to delete the preference by the testuser
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("DELETE", obj_id=res["response"]["id"],
                              auth_token=testuser_auth_token,
                              data={"settings": [self.test_preference.keys()[0]]})
        self.assertEqual(err.exception.response.status_code, 401)
        self.assertEqual(str(err.exception.response.json()), "You are not allowed to delete "
                                                             "preferences of other users")
