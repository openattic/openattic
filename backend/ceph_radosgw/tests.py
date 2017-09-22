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
from django.test import TestCase
import mock

from ceph_radosgw.rgw_client import RGWClient


class RGWClientTestCase(TestCase):
    @mock.patch('ceph_radosgw.rgw_client.Settings')
    def test_load_settings(self, Settings_mock):
        Settings_mock.RGW_API_HOST = 'host'
        Settings_mock.RGW_API_PORT = 42
        Settings_mock.RGW_API_SCHEME = 'https'
        Settings_mock.RGW_API_ADMIN_RESOURCE = 'ADMIN_RESOURCE'
        Settings_mock.RGW_API_USER_ID = 'USER_ID'
        Settings_mock.RGW_API_ACCESS_KEY = 'ak'
        Settings_mock.RGW_API_SECRET_KEY = 'sk'

        RGWClient._load_settings()  # Also test import of awsauth.S3Auth

        self.assertEqual(RGWClient._host, 'host')
        self.assertEqual(RGWClient._port, 42)
        self.assertEqual(RGWClient._ssl, True)
        self.assertEqual(RGWClient._ADMIN_PATH, 'ADMIN_RESOURCE')
        self.assertEqual(RGWClient._SYSTEM_USERID, 'USER_ID')
        instance = RGWClient._user_instances[RGWClient._SYSTEM_USERID]
        self.assertEqual(instance.userid, 'USER_ID')
