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

from django.test import TestCase
from mock import mock
from requests import ConnectionError
from ceph_deployment.models.ceph_minion import all_metadata, merge_pillar_metadata, CephMinion
from deepsea import DeepSea
from ifconfig.models import get_host_name
from rest_client import BadResponseFormatException, RequestException
from django.conf import settings
from sysutils.database_utils import make_default_admin
from nodb.models import NodbQuerySet


class DeepSeaTestCase(TestCase):
    def test_deepsea_singleton(self):
        api = DeepSea.instance()
        api2 = DeepSea.instance()
        self.assertEqual(api, api2)

    def test_deepsea_service_online(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp_post = mock.MagicMock()
            resp_post.ok = True
            resp_post.status_code = 200
            resp_post.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp_post

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {'return': 'Welcome'}
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            self.assertTrue(api.is_service_online())

            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())

    def test_deepsea_service_offline_response_format_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp_post = mock.MagicMock()
            resp_post.ok = True
            resp_post.status_code = 200
            resp_post.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp_post

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {'no_return': 'Welcome'}
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(BadResponseFormatException):
                api.is_service_online()

            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())

    def test_deepsea_service_offline_request_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp_post = mock.MagicMock()
            resp_post.ok = True
            resp_post.status_code = 200
            resp_post.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp_post

            resp = mock.MagicMock()
            resp.ok = False
            resp.status_code = 404
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(RequestException):
                api.is_service_online()

            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())

    def test_deepsea_service_offline_connection_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp_post = mock.MagicMock()
            resp_post.ok = True
            resp_post.status_code = 200
            resp_post.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp_post
            mock_requests_session().get.side_effect = ConnectionError()

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(RequestException):
                api.is_service_online()

            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())

    def test_deepsea_login_success(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            api._login()

            self.assertTrue(mock_requests_session().post.called)
            self.assertEqual(mock_requests_session().post.call_args[1]['data'],
                             {'username': 'hello', 'password': 'world', 'eauth': 'auto'})
            self.assertTrue(api._is_logged_in())
            self.assertEqual(api.token, 'validtoken')

    def test_deepsea_login_fail_401(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = False
            resp.status_code = 401
            mock_requests_session().post.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(RequestException) as context:
                api._login()

            self.assertEqual(context.exception.status_code, 401)
            self.assertTrue(mock_requests_session().post.called)
            self.assertEqual(mock_requests_session().post.call_args[1]['data'],
                             {'username': 'hello', 'password': 'world', 'eauth': 'auto'})
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_login_connection_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().post.side_effect = ConnectionError()

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(RequestException) as context:
                api._login()

            self.assertEqual(context.exception.status_code, None)
            self.assertTrue(mock_requests_session().post.called)
            self.assertEqual(mock_requests_session().post.call_args[1]['data'],
                             {'username': 'hello', 'password': 'world', 'eauth': 'auto'})
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_login_response_format_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {'invalidtoken': 'validtoken'}
            }
            mock_requests_session().post.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(BadResponseFormatException):
                api._login()

            self.assertTrue(mock_requests_session().post.called)
            self.assertEqual(mock_requests_session().post.call_args[1]['data'],
                             {'username': 'hello', 'password': 'world', 'eauth': 'auto'})
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    _login_resp = mock.MagicMock(ok=True, status_code=200, **{'json.return_value': {
                'return': [{'token': 'validtoken'}]
            }})

    def test_deepsea_keys_success(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().post.return_value = self._login_resp

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1', 'minion2'],
                    'minions_pre': ['minion3'],
                    'minions_denied': [],
                    'minions_rejected': ['minion4']
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(res, {
                'minions': ['minion1', 'minion2'],
                'minions_pre': ['minion3'],
                'minions_denied': [],
                'minions_rejected': ['minion4']
            })

    def test_deepsea_keys_unauthorized(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().post.side_effect = [
                self._login_resp, self._login_resp
            ]

            resp_un = mock.MagicMock()
            resp_un.ok = False
            resp_un.status_code = 401

            resp_ok = mock.MagicMock()
            resp_ok.ok = True
            resp_ok.status_code = 200
            resp_ok.json.return_value = {
                'return': {
                    'minions': ['minion1', 'minion2'],
                    'minions_pre': ['minion3'],
                    'minions_denied': [],
                    'minions_rejected': ['minion4']
                }
            }
            mock_requests_session().get.side_effect = [resp_un, resp_ok]

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertEqual(res, {
                'minions': ['minion1', 'minion2'],
                'minions_pre': ['minion3'],
                'minions_denied': [],
                'minions_rejected': ['minion4']
            })

    def test_deepsea_keys_login_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            login_resp_err = mock.MagicMock()
            login_resp_err.ok = False
            login_resp_err.status_code = 503

            mock_requests_session().post.side_effect = [
                self._login_resp, login_resp_err
            ]

            resp_un = mock.MagicMock()
            resp_un.ok = False
            resp_un.status_code = 401

            mock_requests_session().get.side_effect = [resp_un]

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(RequestException) as context:
                api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertEqual(context.exception.status_code, 503)

    def test_deepsea_keys_response_format_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().post.return_value = self._login_resp

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1', 'minion2'],
                    'minions_denied': [],
                    'minions_rejected': ['minion4']
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(BadResponseFormatException) as context:
                api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(str(context.exception),
                             "key minions_pre is not in dict {'minions_rejected': ['minion4'], "
                             "'minions_denied': [], 'minions': ['minion1', 'minion2']}")

    def test_deepsea_keys_response_format_error_2(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().post.return_value = self._login_resp

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1', 'minion2'],
                    'minions_pre': 'minion3',
                    'minions_denied': [],
                    'minions_rejected': ['minion4']
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            with self.assertRaises(BadResponseFormatException) as context:
                api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(str(context.exception), "minion3 is not an array")

    def test_deepsea_pillar_items_success(self):
        with mock.patch("requests.Session") as mock_requests_session:

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': [{
                    'minion1': {
                        'roles': ['storage', 'mon', 'igw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                    },
                    'minion2': {
                        'roles': ['storage', 'rgw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                    }
                }]
            }
            mock_requests_session().post.side_effect = [self._login_resp, resp]

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.pillar_items()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(res, {
                'minion1': {
                    'roles': ['storage', 'mon', 'igw'],
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                },
                'minion2': {
                    'roles': ['storage', 'rgw'],
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                }
            })

    def test_deepsea_get_minions(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp_pillar = mock.MagicMock()
            resp_pillar.ok = True
            resp_pillar.status_code = 200
            resp_pillar.json.return_value = {
                'return': [{
                    'minion1': {
                        'roles': ['storage', 'mon', 'igw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                    },
                    'minion2': {
                        'roles': ['storage', 'rgw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                    }
                }]
            }
            mock_requests_session().post.side_effect = [self._login_resp, resp_pillar]

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1'],
                    'minions_pre': [],
                    'minions_denied': [],
                    'minions_rejected': ['minion2']
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.get_minions()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(res, [
                {
                    'roles': ['storage', 'mon', 'igw'],
                    'hostname': 'minion1',
                    'key_status': 'accepted',
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                },
                {
                    'roles': ['storage', 'rgw'],
                    'public_network': '10.1.0.0/24',
                    'hostname': 'minion2',
                    'key_status': 'rejected',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                }
            ])

    def test_deepsea_get_minions_no_role(self):
        """Regression for OP-2507: DeepSea: "roles" is missing from response"""
        with mock.patch("requests.Session") as mock_requests_session:
            resp_pillar = mock.MagicMock()
            resp_pillar.ok = True
            resp_pillar.status_code = 200
            resp_pillar.json.return_value = {
                'return': [{
                    'minion1': {
                        "time_init": "ntp",
                        "rgw_configurations": { "rgw": { "users": {
                            "email": "admin@admin.nil",
                            "system": True,
                            "name": "Admin",
                            "uid": "admin"
                            }}
                        },
                        "available_roles": [
                            "storage", "admin", "mon", "mds", "mgr", "igw", "openattic", "rgw",
                            "ganesha", "client-cephfs", "client-radosgw", "client-iscsi", "client-nfs",
                            "master"
                        ],
                        "benchmark": {
                            "log-file-directory": "/var/log/cephfs_bench_logs",
                            "job-file-directory": "/run/cephfs_bench_jobs",
                            "default-collection": "simple.yml",
                            "work-directory": "/run/cephfs_bench"
                        },
                        "master_minion": "master_minion.openattic.org",
                        "time_server": "master_minion.openattic.org",
                        "igw_config": "default-ui",
                        "cluster": "ceph",
                        "public_network": "10.0.0.0/19",
                        "cluster_network": "10.0.0.0/19",
                        "stage_prep_master": "default",
                        "fsid": "c0f85b6a-70d7-4c49-81fa-64ed80069e24"
                    },
                }]
            }
            mock_requests_session().post.side_effect = [self._login_resp, resp_pillar]

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1'],
                    'minions_pre': [],
                    'minions_denied': [],
                    'minions_rejected': []
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.get_minions()

            self.assertEqual(res, [
                {'benchmark': {'log-file-directory': '/var/log/cephfs_bench_logs',
                               'job-file-directory': '/run/cephfs_bench_jobs',
                               'default-collection': 'simple.yml',
                               'work-directory': '/run/cephfs_bench'},
                 'master_minion': 'master_minion.openattic.org',
                 'time_server': 'master_minion.openattic.org', 'igw_config': 'default-ui',
                 'cluster': 'ceph',
                 'fsid': 'c0f85b6a-70d7-4c49-81fa-64ed80069e24', 'time_init': 'ntp',
                 'rgw_configurations': {'rgw': {
                     'users': {'uid': 'admin', 'email': 'admin@admin.nil', 'name': 'Admin',
                               'system': True}}},
                 'available_roles': ['storage', 'admin', 'mon', 'mds', 'mgr', 'igw', 'openattic',
                                     'rgw', 'ganesha', 'client-cephfs', 'client-radosgw',
                                     'client-iscsi', 'client-nfs', 'master'], 'hostname': 'minion1',
                 'key_status': 'accepted',
                 'public_network': '10.0.0.0/19', 'cluster_network': '10.0.0.0/19',
                 'stage_prep_master': 'default'}
            ])

    def test_deepsea_get_minions_no_public_network(self):
        """Regression test for OP-2595: DeepSea's pillar data doesn't contain "public_network" """
        with mock.patch("requests.Session") as mock_requests_session:
            resp_pillar = mock.MagicMock()
            resp_pillar.ok = True
            resp_pillar.status_code = 200
            resp_pillar.json.return_value = {
                'return': [{
                    'minion1': {
                        u'time_init': u'ntp',
                        u'roles': [u'storage'],
                        u'time_server': u'ses-node01',
                        u'master_minion': u'ses-node01',
                        u'benchmark': {u'log-file-directory': u'/var/log/ceph_bench_logs',
                                       u'job-file-directory': u'/run/ceph_bench_jobs',
                                       u'default-collection': u'simple.yml',
                                       u'work-directory': u'/run/ceph_bench'},
                        u'cluster': u'unassigned', u'deepsea_minions': u'*'
                    },
                }]
            }
            mock_requests_session().post.side_effect = [self._login_resp, resp_pillar]

            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': {
                    'minions': ['minion1'],
                    'minions_pre': [],
                    'minions_denied': [],
                    'minions_rejected': []
                }
            }
            mock_requests_session().get.return_value = resp

            api = DeepSea('localhost', 8000, 'auto', 'hello', 'world')
            res = api.get_minions()

            self.assertEqual(res, [
                    {
                        'hostname': 'minion1',
                        'key_status': 'accepted',
                        u'time_init': u'ntp',
                        u'roles': [u'storage'],
                        u'time_server': u'ses-node01',
                        u'master_minion': u'ses-node01',
                        u'benchmark': {u'log-file-directory': u'/var/log/ceph_bench_logs',
                                       u'job-file-directory': u'/run/ceph_bench_jobs',
                                       u'default-collection': u'simple.yml',
                                       u'work-directory': u'/run/ceph_bench'},
                        u'cluster': u'unassigned', u'deepsea_minions': u'*'
                    }
                ]
            )


class MetadataTestCase(TestCase):

    @mock.patch('ceph_deployment.models.ceph_minion.MonApi')
    @mock.patch('ceph_deployment.models.ceph_minion.CephCluster')
    def test_metadata(self, CephCluster_mock, MonApi_mock):
        with open('ceph_deployment/tests/metadata.json') as f:
            osd, mon, mds, mgr, expected_result, _, _ = json.load(f)

        MonApi_mock.return_value.osd_metadata.return_value = osd
        MonApi_mock.return_value.mon_metadata.return_value = mon
        MonApi_mock.return_value.mds_metadata.return_value = mds
        MonApi_mock.return_value.mgr_metadata.return_value = mgr
        CephCluster_mock.objects.all.return_value = [mock.MagicMock(fsid='fsid')]

        res = all_metadata()
        self.assertEqual(res, expected_result)

    @mock.patch('ceph_deployment.models.ceph_minion.DeepSea')
    @mock.patch('ceph_deployment.models.ceph_minion.all_metadata')
    def test_merge_pillar_metadata(self, all_metadata_mock, DeepSea_mock):
        with open('ceph_deployment/tests/metadata.json') as f:
            _, _, _, _, all_metadata, pillar_data, expected_result = json.load(f)

        all_metadata_mock.return_value = all_metadata
        DeepSea_mock.instance.return_value.get_minions.return_value = pillar_data

        res = merge_pillar_metadata()
        self.assertEqual(res, expected_result)

    @mock.patch('ceph_deployment.models.ceph_minion.getaddrinfo')
    def test_addresses(self, getaddrinfo_mock):
        getaddrinfo_mock.return_value = [
            (10, 1, 6, '', ('2a00:1450:4001:81b::2003', 0, 0, 0)),
            (10, 2, 17, '', ('2a00:1450:4001:81b::2003', 0, 0, 0)),
            (10, 3, 0, '', ('2a00:1450:4001:81b::2003', 0, 0, 0)),
            (2, 1, 6, '', ('172.217.22.35', 0)),
            (2, 2, 17, '', ('172.217.22.35', 0)),
            (2, 3, 0, '', ('172.217.22.35', 0)),
            (2, 3, 0, '', ('127.0.0.1', 0)),
            (2, 3, 0, '', ('127.0.1.1', 0)),
            (2, 3, 0, '', ('::1', 0)),
        ]
        m = CephMinion(hostname=get_host_name())
        self.assertTrue(m.attribute_is_unevaluated_lazy_property('addresses'))
        print m.addresses
        self.assertEqual(m.addresses, {'172.217.22.35', '2a00:1450:4001:81b::2003'})


class CephMinionViewSetTestCase(TestCase):

    @classmethod
    def setUpClass(self):
        make_default_admin()

    def setUp(self):
        self.assertTrue(self.client.login(username=settings.OAUSER, password='openattic'))

    @mock.patch('ceph_deployment.models.ceph_minion.DeepSea')
    @mock.patch('ceph_deployment.models.ceph_minion.all_metadata')
    def test_search_wo_value(self, all_metadata_mock, DeepSea_mock):
        with open('ceph_deployment/tests/metadata.json') as f:
            _, _, _, _, all_metadata, pillar_data, _ = json.load(f)

        all_metadata_mock.return_value = all_metadata
        DeepSea_mock.instance.return_value.get_minions.return_value = pillar_data

        response = self.client.get('/api/cephminions?ordering=hostname&page=1'
                                   '&pageSize=10&search=')
        content = json.loads(response.content)
        self.assertEqual(content['count'], 4)

    @mock.patch('ceph_deployment.models.ceph_minion.DeepSea')
    @mock.patch('ceph_deployment.models.ceph_minion.all_metadata')
    def test_search_w_value(self, all_metadata_mock, DeepSea_mock):
        with open('ceph_deployment/tests/metadata.json') as f:
            _, _, _, _, all_metadata, pillar_data, _ = json.load(f)

        all_metadata_mock.return_value = all_metadata
        DeepSea_mock.instance.return_value.get_minions.return_value = pillar_data

        response = self.client.get('/api/cephminions?ordering=hostname&page=1'
                                   '&pageSize=10&search=host2')
        content = json.loads(response.content)
        self.assertEqual(content['count'], 1)
