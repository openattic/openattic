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

from scenarios import RgwProxyTestScenario


class RgwProxyTestCase(RgwProxyTestScenario):
    user_keys = ['caps', 'display_name', 'email', 'keys', 'max_buckets', 'subusers', 'suspended',
                 'swift_keys', 'tenant', 'user_id']

    def test_get(self):
        resp = self.send_api_request('GET', 'user', params={'uid': 'admin'})
        data = resp.json()
        self.assertIsInstance(data, dict)
        self.assertTrue(all([key in data for key in self.user_keys]))
        self.assertEqual(resp.status_code, 200)

    def test_post(self):
        # Updates the email address of user `admin`
        resp = self.send_api_request('POST', 'user', params={'uid': 'admin'},
                                     data={'email': 'foo@bar.com'})
        data = resp.json()
        self.assertTrue(all([key in data for key in self.user_keys]))
        self.assertEqual(resp.status_code, 200)

    def test_put(self):
        resp = self.send_api_request('PUT', 'user', params={
            'uid': 'admin',
            'caps': '',
            'user-caps': 'usage=read,write;user=write',
        })
        self.assertTrue(resp.status_code, 200)

    def test_delete(self):
        resp = self.send_api_request('PUT', 'user', params={
            'uid': 'admin',
            'caps': '',
            'user-caps': 'usage=read,write;user=write',
        })
        self.assertTrue(resp.status_code, 200)
