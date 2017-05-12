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

from ceph_deployment import DeepSea
from ceph_deployment.conf import settings
from ceph_deployment.lrbd_conf import LRBDConf, LRBDUi
from ceph_deployment.models.iscsi_target import iSCSITarget
from rest_client import RequestException, BadResponseFormatException


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

    def test_deepsea_iscsi_interfaces(self):
        with mock.patch("requests.Session") as mock_requests_session:
            login_resp = mock.MagicMock()
            login_resp.ok = True
            login_resp.status_code = 200
            login_resp.json.return_value = {
                'return': [{'token': 'validtoken'}]
            }

            rest_iscsi = mock.MagicMock()
            rest_iscsi.ok = True
            rest_iscsi.status_code = 200
            rest_iscsi.json.return_value = {
                'return': [{
                    'minion1': ['192.168.10.101', '192.168.121.41'],
                    'minion2': ['192.168.10.102', '192.168.121.42']
                }]
            }
            mock_requests_session().post.side_effect = [login_resp, rest_iscsi]

            api = DeepSea()
            res = api.iscsi_interfaces()

            self.assertTrue(mock_requests_session().post.called)
            self.assertTrue(api._is_logged_in())
            self.assertEqual(res, [
                {'hostname': 'minion1', 'interfaces': ['192.168.10.101', '192.168.121.41']},
                {'hostname': 'minion2', 'interfaces': ['192.168.10.102', '192.168.121.42']}
            ])

class LRBDTestCase(TestCase):
    def setUp(self):
        self.lrbd_config = {
            "pools":[{
                "gateways":[{
                    "tpg":[{
                        "image":"demo",
                        "lun":"0"
                    }, {
                        "image":"image1",
                        "lun":"1"
                    }],
                    "target":"iqn.1996-04.de.suse:1493911039367"
                }, {
                    "tpg":[{
                        "image":"image2",
                        "lun":"0",
                        "retry_errors": [90, 95],
                        "uuid": "my_image_uuid"
                    }],
                    "target":"iqn.1996-04.de.suse:1493911282678"
                }, {
                    "tpg":[{
                        "image":"image1",
                        "initiator":"iqn.2016-06.org.openattic:storage:disk.sn-a8675309",
                        "lun":"0"
                    }, {
                        "image":"image1",
                        "initiator":"iqn.1996-04.de.suse:client:1234",
                    }],
                    "target":"iqn.1996-04.de.suse:1493975262802"
                }],
                "pool":"rbd"
            }],
            "portals":[{
                "name":"portal-node1-1",
                "addresses":["192.168.100.201"]
            }, {
                "name":"portal-node2-1",
                "addresses":["192.168.100.202"]
            }, {
                "name":"portal-node1-2",
                "addresses":["192.168.121.211"]
            }],
            "targets":[{
                "tpg_login_timeout": "10",
                "hosts":[{
                    "host":"node1",
                    "portal":"portal-node1-1"
                }, {
                    "host":"node2",
                    "portal":"portal-node2-1"
                }],
                "tpg_default_erl": "2",
                "target":"iqn.1996-04.de.suse:1493911039367"
            }, {
                "hosts":[{
                    "host":"node2",
                    "portal":"portal-node2-1"
                }],
                "target":"iqn.1996-04.de.suse:1493911282678"
            }, {
                "hosts":[{
                    "host":"node1",
                    "portal":"portal-node1-2"
                }],
                "target":"iqn.1996-04.de.suse:1493975262802"
            }],
            "auth":[{
                "authentication":"none",
                "target":"iqn.1996-04.de.suse:1493911039367"
            }, {
                "authentication":"none",
                "target":"iqn.1996-04.de.suse:1493911282678"
            }, {
                "tpg":{
                    "userid_mutual":"mutual_hello",
                    "mutual":"enable",
                    "password":"world",
                    "userid":"hello",
                    "password_mutual":"mutual_world"
                },
                "authentication":"tpg+identified",
                "target":"iqn.1996-04.de.suse:1493975262802",
                "discovery":{
                    "userid_mutual":"disc_mut_hello",
                    "mutual":"enable",
                    "userid":"disc_hello",
                    "auth":"disable",
                    "password_mutual":"disc_mut_world",
                    "password":"disc_world"
                }
            }]
        }

        self.lrbd_ui = [{
            'targetId': 'iqn.1996-04.de.suse:1493911039367',
            'targetSettings': {
                'tpg_login_timeout': 10,
                'tpg_default_erl': 2,
            },
            'images': [{
                'pool': 'rbd',
                'name': 'demo',
                'settings': {
                    'lun': 0
                }
            }, {
                'pool': 'rbd',
                'name': 'image1',
                'settings': {
                    'lun': 1
                }
            }],
            'portals': [{
                'hostname': 'node2',
                'interface': '192.168.100.202'
            }, {
                'hostname': 'node1',
                'interface': '192.168.100.201'
            }],
            'authentication': {
                'password': None,
                'hasMutualAuthentication': False,
                'hasAuthentication': False,
                'user': None,
                'discoveryMutualUser': None,
                'enabledDiscoveryMutualAuthentication': False,
                'enabledMutualAuthentication': False,
                'discoveryPassword': None,
                'mutualUser': None,
                'discoveryUser': None,
                'initiators': [],
                'enabledDiscoveryAuthentication': False,
                'hasDiscoveryMutualAuthentication': False,
                'mutualPassword': None,
                'discoveryMutualPassword': None,
                'hasDiscoveryAuthentication': False
            }
        }, {
            'targetId': 'iqn.1996-04.de.suse:1493911282678',
            'targetSettings': {},
            'images': [{
                'pool': 'rbd',
                'name': 'image2',
                'settings': {
                    'lun': 0,
                    'retry_errors': [90, 95],
                    'uuid': 'my_image_uuid'
                }
            }],
            'portals': [{
                'hostname': 'node2',
                'interface': '192.168.100.202'
            }],
            'authentication': {
                'password': None,
                'hasMutualAuthentication': False,
                'hasAuthentication': False,
                'user': None,
                'discoveryMutualUser': None,
                'enabledDiscoveryMutualAuthentication': False,
                'enabledMutualAuthentication': False,
                'discoveryPassword': None,
                'mutualUser': None,
                'discoveryUser': None,
                'initiators': [],
                'enabledDiscoveryAuthentication': False,
                'hasDiscoveryMutualAuthentication': False,
                'mutualPassword': None,
                'discoveryMutualPassword': None,
                'hasDiscoveryAuthentication': False
            }
        }, {
            'targetId': 'iqn.1996-04.de.suse:1493975262802',
            'targetSettings': {},
            'images': [{
                'name': 'image1',
                'pool': 'rbd',
                'settings': {
                    'lun': 0
                }
            }],
            'portals': [{
                'interface': '192.168.121.211',
                'hostname': 'node1'
            }],
            'authentication': {
                'password': 'world',
                'hasMutualAuthentication': True,
                'hasAuthentication': True,
                'user': 'hello',
                'discoveryMutualUser': 'disc_mut_hello',
                'enabledDiscoveryMutualAuthentication': True,
                'enabledMutualAuthentication': True,
                'discoveryPassword': 'disc_world',
                'mutualUser': 'mutual_hello',
                'discoveryUser': 'disc_hello',
                'initiators': [
                    'iqn.2016-06.org.openattic:storage:disk.sn-a8675309',
                    'iqn.1996-04.de.suse:client:1234'
                ],
                'enabledDiscoveryAuthentication': False,
                'hasDiscoveryMutualAuthentication': True,
                'mutualPassword': 'mutual_world',
                'discoveryMutualPassword': 'disc_mut_world',
                'hasDiscoveryAuthentication': True
            }
        }]

    def test_lrbd_conf_to_lrbd_ui(self):
        conf = LRBDConf(self.lrbd_config)
        targets = [t.to_ui_dict() for t in conf.targets()]
        self.assertEqual(targets, self.lrbd_ui)

    def test_lrbd_ui_to_lrbd_conf(self):
        targets = [iSCSITarget(**iSCSITarget.make_model_args(t)) for t in self.lrbd_ui]
        conf = LRBDUi(targets)
        self.assertEquals(json.loads(conf.lrbd_conf_json()), self.lrbd_config)
