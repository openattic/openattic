# kate: space-indent on; indent-width 4; replace-tabs on;

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

import mock
import tempfile

from django.test import TestCase

import ceph.models

from ceph.librados import Keyring

class ClusterTestCase(TestCase):
    def test_get_recommended_pg_num(self):
        with mock.patch("ceph.models.Cluster.osd_set") as mock_osd_set:
            c = ceph.models.Cluster()
            # small setups
            mock_osd_set.count.return_value = 2
            self.assertEqual(c.get_recommended_pg_num(3), 128)
            mock_osd_set.count.return_value = 3
            self.assertEqual(c.get_recommended_pg_num(3), 128)

            # the example from the Ceph docs
            mock_osd_set.count.return_value = 200
            self.assertEqual(c.get_recommended_pg_num(3), 8192)

            # make sure the rounding step doesn't round up a power of two to
            # the next power of two above it, but keeps it unaltered
            mock_osd_set.count.return_value = 8192
            self.assertEqual(c.get_recommended_pg_num(100), 8192)


class KeyringTestCase(TestCase):
    def test_keyring_succeeds(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") as tmpfile:
            tmpfile.write("[client.admin]")
            tmpfile.flush()
            keyring = Keyring('ceph', '/tmp')
            self.assertEqual(keyring.username, 'client.admin')

    def test_keyring_raises_runtime_error(self):
        try:
            keyring = Keyring('ceph', '/tmp')
        except RuntimeError, e:
            return True

    def test_username_raises_runtime_error(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") as tmpfile:
            tmpfile.write("abcdef")
            tmpfile.flush()
            try:
                keyring = Keyring('ceph', '/tmp')
            except RuntimeError, e:
                return True


class CephPoolTestCase(TestCase):
    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.rados')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_insert(self, MonApi_mock, rados_mock, cephpool_objects_mock):
        cephpool_objects_mock.nodb_context = mock.Mock(fsid='hallo')
        cephpool_objects_mock.get.return_value = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated')

        # Inserting new pool.
        pool = ceph.models.CephPool(name='test', pg_num=0, type='replicated')
        pool.save()
        MonApi_mock.return_value.osd_pool_create.assert_called_with(pool='test', pg_num=0, pgp_num=0,
                                                                    pool_type='replicated', erasure_code_profile=None)
        cephpool_objects_mock.get.assert_called_with(name='test')
        self.assertFalse(pool._state.adding)

        # Modifying existing pool.
        pool = ceph.models.CephPool(id=0, name='test', pg_num=1, type='replicated')
        pool.save()
        calls = [mock.call(pool='test', var='pg_num', val=1),
                 mock.call(pool='test', var='pgp_num', val=1)]
        MonApi_mock.return_value.osd_pool_set.assert_has_calls(calls)

        # Creating a pool tier.
        # FIXME: as get() returns pool with id=0, we cannot really use a different pool here.
        MonApi_mock.return_value.osd_pool_set.reset_mock()
        pool = ceph.models.CephPool(id=0, name='test1', pg_num=0, type='replicated',
                                    tier_of=ceph.models.CephPool(id=999))
        pool.save()
        MonApi_mock.return_value.osd_tier_add.assert_called_with(pool='test', tierpool='test1')

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.rados')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_call_order(self, MonApi_mock, rados_mock, cephpool_objects_mock):
        """
        .. seealso: http://stackoverflow.com/questions/7242433/asserting-successive-calls-to-a-mock-method
        """
        cephpool_objects_mock.nodb_context = mock.Mock(fsid='hallo')
        cephpool_objects_mock.get.return_value = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated')

        # Checking the order of different calls.
        pool = ceph.models.CephPool(name='test1', pg_num=0, type='replicated', cache_mode='writeback',
                                    tier_of=ceph.models.CephPool(id=1))
        pool.save()
        calls = [
            mock.call.osd_pool_create('test1', 0, 0, 'replicated', None),
            mock.call.osd_tier_add('test', 'test1'),
            mock.call.osd_tier_cache_mode('test1', 'writeback')
        ]
        MonApi_mock.return_value.assert_has_calls(calls)

        # Checking the reverse order.
        # FIXME: as get() returns pool with id=0, save() cannot determine the original tier_of, resulting
        #        in wired parameters to osd_tier_remove.
        cephpool_objects_mock.get.return_value = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated',
                                                                      cache_mode='writeback',
                                                                      tier_of=ceph.models.CephPool(id=0, name='test',
                                                                                                   pg_num=0,
                                                                                                   type='replicated'))
        MonApi_mock.return_value.reset_mock()
        pool = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated', cache_mode='none', tier_of=None)
        pool.save()
        calls = [
            mock.call.osd_tier_cache_mode('test', 'none'),
            mock.call.osd_tier_remove('test', 'test'),
        ]
        MonApi_mock.return_value.assert_has_calls(calls)
