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
from django.conf import settings
from django.test import TestCase
from mock import mock
from requests import ConnectionError

from deepsea import DeepSea
from rest_client import BadResponseFormatException, RequestException


class DeepSeaTestCase(TestCase):
    def setUp(self):
        settings.SALT_API_USERNAME = 'hello'
        settings.SALT_API_PASSWORD = 'world'
        settings.SALT_API_EAUTH = 'auto'

    def test_deepsea_singleton(self):
        api = DeepSea.instance()
        api2 = DeepSea.instance()
        self.assertEqual(api, api2)

    def test_deepsea_service_online(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {'return': 'Welcome'}
            mock_requests_session().get.return_value = resp

            api = DeepSea()
            self.assertTrue(api.is_service_online())

            self.assertTrue(mock_requests_session().get.called)
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_service_offline_response_format_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {'no_return': 'Welcome'}
            mock_requests_session().get.return_value = resp

            api = DeepSea()
            self.assertFalse(api.is_service_online())

            self.assertTrue(mock_requests_session().get.called)
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_service_offline_request_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = False
            resp.status_code = 404
            mock_requests_session().get.return_value = resp

            api = DeepSea()
            self.assertFalse(api.is_service_online())

            self.assertTrue(mock_requests_session().get.called)
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_service_offline_connection_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            mock_requests_session().get.side_effect = ConnectionError()

            api = DeepSea()
            self.assertFalse(api.is_service_online())

            self.assertTrue(mock_requests_session().get.called)
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_login_success(self):
        with mock.patch("requests.Session") as mock_requests_session:
            resp = mock.MagicMock()
            resp.ok = True
            resp.status_code = 200
            resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = resp

            api = DeepSea()
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

            api = DeepSea()
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

            api = DeepSea()
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

            api = DeepSea()
            with self.assertRaises(BadResponseFormatException):
                api._login()

            self.assertTrue(mock_requests_session().post.called)
            self.assertEqual(mock_requests_session().post.call_args[1]['data'],
                             {'username': 'hello', 'password': 'world', 'eauth': 'auto'})
            self.assertFalse(api._is_logged_in())
            self.assertEqual(api.token, None)

    def test_deepsea_keys_success(self):
        with mock.patch("requests.Session") as mock_requests_session:
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = login_resp

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

            api = DeepSea()
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
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }

            mock_requests_session().post.side_effect = [
                login_resp, login_resp
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

            api = DeepSea()
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
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }

            login_resp_err = mock.MagicMock()
            login_resp_err.ok = False
            login_resp_err.status_code = 503

            mock_requests_session().post.side_effect = [
                login_resp, login_resp_err
            ]

            resp_un = mock.MagicMock()
            resp_un.ok = False
            resp_un.status_code = 401

            mock_requests_session().get.side_effect = [resp_un]

            api = DeepSea()
            with self.assertRaises(RequestException) as context:
                api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertEqual(context.exception.status_code, 503)

    def test_deepsea_keys_response_format_error(self):
        with mock.patch("requests.Session") as mock_requests_session:
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = login_resp

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

            api = DeepSea()
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
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }
            mock_requests_session().post.return_value = login_resp

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

            api = DeepSea()
            with self.assertRaises(BadResponseFormatException) as context:
                api.key_list()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(mock_requests_session().get.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(str(context.exception), "minion3 is not an array")

    def test_deepsea_pillar_items_success(self):
        with mock.patch("requests.Session") as mock_requests_session:
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }

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
            mock_requests_session().post.side_effect = [login_resp, resp]

            api = DeepSea()
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
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }

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
            mock_requests_session().post.side_effect = [login_resp, resp_pillar]

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

            api = DeepSea()
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
