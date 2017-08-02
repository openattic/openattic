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
from django.test import TestCase
from mock import mock
from requests import ConnectionError

from deepsea import DeepSea
from rest_client import BadResponseFormatException, RequestException


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
                        'public_address': '10.1.0.1',
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                        'mon_host': ['10.1.0.1'],
                        'mon_initial_members': ['minion1']
                    },
                    'minion2': {
                        'roles': ['storage', 'rgw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                        'mon_host': ['10.1.0.1'],
                        'mon_initial_members': ['minion1']
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
                    'public_address': '10.1.0.1',
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                    'mon_host': ['10.1.0.1'],
                    'mon_initial_members': ['minion1']
                },
                'minion2': {
                    'roles': ['storage', 'rgw'],
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                    'mon_host': ['10.1.0.1'],
                    'mon_initial_members': ['minion1']
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
                        'public_address': '10.1.0.1',
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                        'mon_host': ['10.1.0.1'],
                        'mon_initial_members': ['minion1']
                    },
                    'minion2': {
                        'roles': ['storage', 'rgw'],
                        'public_network': '10.1.0.0/24',
                        'cluster_network': '10.1.0.0/24',
                        'fsid': 'aaabbb',
                        'mon_host': ['10.1.0.1'],
                        'mon_initial_members': ['minion1']
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
                    'public_address': '10.1.0.1',
                    'hostname': 'minion1',
                    'key_status': 'accepted',
                    'public_network': '10.1.0.0/24',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                    'mon_host': ['10.1.0.1'],
                    'mon_initial_members': ['minion1']
                },
                {
                    'roles': ['storage', 'rgw'],
                    'public_network': '10.1.0.0/24',
                    'hostname': 'minion2',
                    'key_status': 'rejected',
                    'cluster_network': '10.1.0.0/24',
                    'fsid': 'aaabbb',
                    'mon_host': ['10.1.0.1'],
                    'mon_initial_members': ['minion1']
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
                        "mon_host": ["10.0.0.5", "10.0.0.2", "10.0.0.4", "10.0.0.3"],
                        "public_network": "10.0.0.0/19",
                        "mon_initial_members": ["minion1"],
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
                 'cluster': 'ceph', 'mon_initial_members': ['minion1'],
                 'fsid': 'c0f85b6a-70d7-4c49-81fa-64ed80069e24', 'time_init': 'ntp',
                 'rgw_configurations': {'rgw': {
                     'users': {'uid': 'admin', 'email': 'admin@admin.nil', 'name': 'Admin',
                               'system': True}}},
                 'available_roles': ['storage', 'admin', 'mon', 'mds', 'mgr', 'igw', 'openattic',
                                     'rgw', 'ganesha', 'client-cephfs', 'client-radosgw',
                                     'client-iscsi', 'client-nfs', 'master'], 'hostname': 'minion1',
                 'key_status': 'accepted',
                 'mon_host': ['10.0.0.5', '10.0.0.2', '10.0.0.4', '10.0.0.3'],
                 'public_network': '10.0.0.0/19', 'cluster_network': '10.0.0.0/19',
                 'stage_prep_master': 'default'}
            ])
