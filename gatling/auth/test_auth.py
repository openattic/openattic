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
import json
from os.path import dirname, realpath

import requests
from configobj import ConfigObj

from auth.scenarios import TokenAuthTestScenario


class TokenAuthTestCase(TokenAuthTestScenario):
    longMessage = True

    def test_get_authtoken_by_username_and_password(self):
        """ Try to request the auth token with correct user data. """
        res = self.get_auth_token()
        self.assertIsNotNone(res)

    def test_get_authtoken_wrong_password(self):
        """ Try to request the auth token with a wrong password. """
        with self.assertRaises(requests.HTTPError) as err:
            self.get_auth_token(password="wrongpass")

        err_message = err.exception.response.json()
        self.assertEqual(err.exception.response.status_code, 400)
        self.assertEqual(err_message["non_field_errors"][0], "Unable to log in with provided "
                                                             "credentials.")

    def test_get_authtoken_wrong_username(self):
        """ Try to request the auth token with a wrong username. """
        with self.assertRaises(requests.HTTPError) as err:
            self.get_auth_token(username="wronguser")

        err_message = err.exception.response.json()
        self.assertEqual(err.exception.response.status_code, 400)
        self.assertEqual(err_message["non_field_errors"][0], "Unable to log in with provided "
                                                             "credentials.")

    def test_cookie_dont_expire_at_browser_close(self):
        # Request a cookie that expires after 2 weeks (Django default).
        res = requests.post(self.base_url + "auth", json={
            "username": self.conf.get("options", "admin"),
            "password": self.conf.get("options", "password"),
            "stay_signed_in": True
        })
        res.raise_for_status()
        # We can not import django.conf.settings here to get SESSION_COOKIE_NAME,
        # so we need to hardcode the default name.
        self.assertIn('sessionid', res.cookies.keys())
        for cookie in res.cookies:
            if cookie.name == 'sessionid':
                self.assertIsInstance(cookie.expires, int)

    def test_cookie_expire_at_browser_close_default(self):
        # Request a cookie that expires when the browser window is closed.
        res = requests.post(self.base_url + "auth", data={
            "username": self.conf.get("options", "admin"),
            "password": self.conf.get("options", "password")
        })
        res.raise_for_status()
        # We can not import django.conf.settings here to get SESSION_COOKIE_NAME,
        # so we need to hardcode the default name.
        self.assertIn('sessionid', res.cookies.keys())
        for cookie in res.cookies:
            if cookie.name == 'sessionid':
                self.assertIsNone(cookie.expires)

    def test_cookie_expire_at_browser_close_force(self):
        # Request a cookie that expires when the browser window is closed.
        res = requests.post(self.base_url + "auth", data={
            "username": self.conf.get("options", "admin"),
            "password": self.conf.get("options", "password"),
            "stay_signed_in": False
        })
        res.raise_for_status()
        # We can not import django.conf.settings here to get SESSION_COOKIE_NAME,
        # so we need to hardcode the default name.
        self.assertIn('sessionid', res.cookies.keys())
        for cookie in res.cookies:
            if cookie.name == 'sessionid':
                self.assertIsNone(cookie.expires)

    def test_server_version(self):
        res = self._do_request('GET', self.base_url + 'hosts/current', self.get_auth_header())
        server_version = json.loads(res.text)[u'oa_version'][u'package'][u'VERSION']
        version_txt = ConfigObj(dirname(dirname(dirname(realpath(__file__)))) + '/version.txt')
        # If this fails, check your testing setup.
        self.assertEqual(server_version, version_txt[u'package'][u'VERSION'],
                         'Server version does not match version.txt')
