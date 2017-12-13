# -*- coding: utf-8 -*-

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

import requests

from rbd.scenarios import RbdDataPoolTestScenario


class RbdCreateDataPoolTestCase(RbdDataPoolTestScenario):

    def test_create_delete_rbd_replicated_pool(self):
        """ Try to create an RBD where the pool and the data-pool are replicated pools. """
        rbd_name = 'test_create_delete_rbd_replicated_pool'

        self._delete_rbd(rbd_name)
        self.assertFalse(self._rbd_exist(rbd_name))

        data = {
            'name': rbd_name,
            'size': 1073741824,
            'obj_size': 4194304,
            'pool': self.replicated_pool_1['id'],
            'data_pool': self.replicated_pool_2['id'],
            'old_format': False,
            'fsid': self.fsid
        }

        res = self.send_ceph_request('POST', self.fsid, 'rbds', data=data)
        self.assertEqual(res['status_code'], 201)
        self.assertEqual(self._rbd_exist(rbd_name), True)
        res_delete = self.send_ceph_request('DELETE', self.fsid, 'rbds/{}/{}'.format(
            self.replicated_pool_1['name'], rbd_name))
        self.assertEqual(res_delete['status_code'], 204)
        self.assertEqual(self._rbd_exist(rbd_name), False)

    def test_create_delete_rbd_ec_pool_ec_overwrites(self):
        """ Try to create an RBD where the pool is an replicated pool and the data-pool an erasure
        coded pool with 'ec_overwrites' flag. """
        rbd_name = 'test_create_delete_rbd_ec_pool_ec_overwrites'

        self._delete_rbd(rbd_name)
        self.assertFalse(self._rbd_exist(rbd_name))

        data = {
            'name': rbd_name,
            'size': 1073741824,
            'obj_size': 4194304,
            'pool': self.replicated_pool_1['id'],
            'data_pool': self.ec_overwrites_pool['id'],
            'old_format': False,
            'fsid': self.fsid
        }

        res = self.send_ceph_request('POST', self.fsid, 'rbds', data=data)
        self.assertEqual(res['status_code'], 201)
        self.assertEqual(self._rbd_exist(rbd_name), True)
        res_delete = self.send_ceph_request('DELETE', self.fsid, 'rbds/{}/{}'.format(
            self.replicated_pool_1['name'], rbd_name))
        self.assertEqual(res_delete['status_code'], 204)
        self.assertEqual(self._rbd_exist(rbd_name), False)

    def test_create_delete_rbd_ec_pool_no_ec_overwrites(self):
        """ Try to create an RBD where the pool is an replicated pool and the data-pool an erasure
        coded pool without 'ec_overwrites' flag and see if it fails. """

        rbd_name = 'test_create_delete_rbd_ec_pool_no_ec_overwrites'

        self._delete_rbd(rbd_name)
        self.assertFalse(self._rbd_exist(rbd_name))

        data = {
            'name': rbd_name,
            'size': 1073741824,
            'obj_size': 4194304,
            'pool': self.replicated_pool_1['id'],
            'data_pool': self.ec_pool['id'],
            'old_format': False,
            'fsid': self.fsid
        }

        with self.assertRaises(requests.HTTPError) as err:
            self.send_ceph_request('POST', self.fsid, 'rbds', data=data)
        self.assertEqual(err.exception.response.status_code, 500)
        self.assertEqual(self._rbd_exist(rbd_name), False)
