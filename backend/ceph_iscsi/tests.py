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
import json

from django.test import TestCase
from mock import mock

from deepsea import DeepSea
from ceph_iscsi.lrbd_conf import LRBDConf, LRBDUi
from ceph_iscsi.models import iSCSITarget
import ceph_iscsi.tasks


class DeepSeaTestCase(TestCase):
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

            api = DeepSea('localhost', 8000, 'auto', 'admin', 'admin')
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


class TaskTest(TestCase):

    @mock.patch('deepsea.DeepSea.iscsi_deploy')
    def test_async_deploy_exports(self, iscsi_deploy_mock):
        task = ceph_iscsi.tasks.async_deploy_exports()
        task.run_once()

        iscsi_deploy_mock.assert_called_once()

    @mock.patch('deepsea.DeepSea.iscsi_undeploy')
    def test_async_undeploy_exports(self, iscsi_undeploy_mock):
        task = ceph_iscsi.tasks.async_stop_exports()
        task.run_once()

        iscsi_undeploy_mock.assert_called_once()
