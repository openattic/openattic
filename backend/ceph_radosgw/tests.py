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
from ceph_radosgw.rgw_client import RGWClient
from django.conf import settings
from django.http import HttpResponse
from django.test import TestCase
from rest_framework import status
from sysutils.database_utils import make_default_admin
import json
import mock


class RGWClientTestCase(TestCase):

    @staticmethod
    def _mock_settings(Settings_mock):
        Settings_mock.RGW_API_HOST = 'host'
        Settings_mock.RGW_API_PORT = 42
        Settings_mock.RGW_API_SCHEME = 'https'
        Settings_mock.RGW_API_ADMIN_RESOURCE = 'ADMIN_RESOURCE'
        Settings_mock.RGW_API_USER_ID = 'USER_ID'
        Settings_mock.RGW_API_ACCESS_KEY = 'ak'
        Settings_mock.RGW_API_SECRET_KEY = 'sk'

    @mock.patch('ceph_radosgw.rgw_client.Settings')
    def test_load_settings(self, Settings_mock):
        RGWClientTestCase._mock_settings(Settings_mock)

        RGWClient._load_settings()  # Also test import of awsauth.S3Auth

        self.assertEqual(RGWClient._host, 'host')
        self.assertEqual(RGWClient._port, 42)
        self.assertEqual(RGWClient._ssl, True)
        self.assertEqual(RGWClient._ADMIN_PATH, 'ADMIN_RESOURCE')
        self.assertEqual(RGWClient._SYSTEM_USERID, 'USER_ID')
        instance = RGWClient._user_instances[RGWClient._SYSTEM_USERID]
        self.assertEqual(instance.userid, 'USER_ID')

    @mock.patch('ceph_radosgw.views.Settings')
    def test_user_delete(self, Settings_mock):
        make_default_admin()
        self.assertTrue(self.client.login(username=settings.OAUSER, password='openattic'))

        Settings_mock.RGW_API_USER_ID = 'admin'
        response = self.client.delete('/api/ceph_radosgw/user/delete?uid=admin')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Can not delete the user', response.data['detail'])

    @mock.patch('ceph_nfs.models.GaneshaExport.objects.filter')
    def test_bucket_delete(self, filter_mock):
        make_default_admin()
        self.assertTrue(self.client.login(username=settings.OAUSER, password='openattic'))

        filter_mock.return_value = [4, 8, 15, 16, 23, 42]
        response = self.client.delete('/api/ceph_radosgw/bucket/delete?bucket=test01')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Can not delete the bucket', response.data['detail'])

    @mock.patch('ceph_radosgw.rgw_client.Settings')
    @mock.patch('ceph_radosgw.views.proxy_view')
    @mock.patch('ceph_nfs.models.GaneshaExport.objects.filter')
    def test_bucket_get(self, filter_mock, proxy_view_mock, Settings_mock):
        RGWClientTestCase._mock_settings(Settings_mock)

        proxy_view_mock.return_value = HttpResponse(json.dumps({
            'owner': 'floyd',
            'bucket': 'my_data'
        }))

        make_default_admin()
        self.assertTrue(self.client.login(username=settings.OAUSER, password='openattic'))

        filter_mock.return_value = [0, 8, 15]
        response = self.client.get('/api/ceph_radosgw/bucket/get?bucket=test01')
        content = json.loads(response.content)
        self.assertIn('is_referenced', content)
        self.assertTrue(content['is_referenced'])

        filter_mock.return_value = []
        response = self.client.get('/api/ceph_radosgw/bucket/get?bucket=test02')
        content = json.loads(response.content)
        self.assertIn('is_referenced', content)
        self.assertFalse(content['is_referenced'])
