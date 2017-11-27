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

import time

from testcase import GatlingTestCase


class RbdDataPoolTestScenario(GatlingTestCase):

    @classmethod
    def setUpClass(cls):
        super(RbdDataPoolTestScenario, cls).setUpClass()
        cls.require_enabled('rbd')
        cls.require_enabled('ceph-blue')
        cls.require_config('ceph-blue', 'fsid')

        cls.fsid = cls.conf.get('ceph-blue', 'fsid')
        cls.replicated_pool_1 = cls.create_test_pool('gatling_pool_replicated_1', 'replicated')
        cls.replicated_pool_2 = cls.create_test_pool('gatling_pool_replicated_2', 'replicated')
        cls.ec_pool = cls.create_test_pool('gatling_pool_ec', 'erasure')
        cls.ec_overwrites_pool = cls.create_test_pool('gatling_pool_ec_overwrites', 'erasure', ['allow_ec_overwrites'])
        cls.pools = [cls.replicated_pool_1, cls.replicated_pool_2, cls.ec_pool, cls.ec_overwrites_pool]

    @classmethod
    def tearDownClass(cls):
        for pool in cls.pools:
            cls.send_ceph_request('DELETE', cls.fsid, 'pools/{}'.format(pool['id']))

    @classmethod
    def create_test_pool(cls, name, type, flags=None):
        pool_data = dict()
        pool_data['fsid'] = cls.fsid
        pool_data['name'] = name
        pool_data['pg_num'] = 1

        if type == 'erasure':
            pool_data.update(
                {'erasure_code_profile': 'default',
                 'min_size': 2,
                 'type': 'erasure'})
        else:
            pool_data.update(
                {'crush_ruleset': 0,
                 'min_size': 1,
                 'size': 1,
                 'type': 'replicated'})

        if flags:
            pool_data["flags"] = flags

        res = cls.send_ceph_request('POST', cls.fsid, 'pools', data=pool_data)
        return res['response']

    def _wait_for_pending_tasks(self):
        while True:
            count = self.send_request('GET', "taskqueue", search_param="status=Not+Started")["count"]
            if count == 0:
                count = self.send_request('GET', "taskqueue", search_param="status=Running")["count"]
            if count == 0:
                break
            time.sleep(1)

    def _rbd_exist(self, rbd_name):
        self._wait_for_pending_tasks()
        res = self.send_ceph_request('GET', self.fsid, 'rbds', search_param='name={}'.format(rbd_name))
        return bool(res['response']['results'])

    def _delete_rbd(self, rbd_name):
        self._wait_for_pending_tasks()
        res = self.send_ceph_request('DELETE', self.fsid, 'rbds', search_param='name={}'.format(rbd_name))
        self._wait_for_pending_tasks()
        return res

