# -*- coding: utf-8 -*-

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

import os
from errno import EPERM

import mock
import tempfile
import json

from ceph.restapi import CephPoolSerializer
from django.test import TestCase

import ceph.models
import ceph.librados
import ceph.tasks
import nodb.models

from ceph.librados import Keyring, undoable, undo_transaction, sort_by_prioritized_users
from ceph.tasks import track_pg_creation


def open_testdata(name):
    return open(os.path.join(os.path.dirname(__file__), name))


class KeyringTestCase(TestCase):
    def test_keyring_succeeds(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") \
                as tmpfile:
            tmpfile.write("[client.admin]")
            tmpfile.flush()
            keyring = Keyring(tmpfile.name)
            self.assertEqual(keyring.available_user_names, ['client.admin'])

    def test_keyring_raises_runtime_error(self):
        try:
            Keyring('/does/not/exist')
        except RuntimeError:
            return True

    def test_username_raises_runtime_error(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") \
                as tmpfile:
            tmpfile.write("abcdef")
            tmpfile.flush()
            try:
                Keyring(tmpfile.name)
            except RuntimeError:
                return True

    def test_keyring_users_sorting(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='keyring', suffix='.keyring') as tmpfile:
            tmpfile.write('[mon.]\n[client.admin]\n[client.rgw]\n[client.openattic]\n')
            tmpfile.flush()
            keyring = Keyring(tmpfile.name)
            self.assertEqual(keyring.available_user_names[0], 'client.openattic')
            self.assertEqual(keyring.available_user_names[1], 'client.admin')

    def test_keyring_sorting(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='keyring1', suffix='.keyring') as tmpfile1:
            with tempfile.NamedTemporaryFile(dir='/tmp', prefix='keyring2', suffix='.keyring') as tmpfile2:
                with tempfile.NamedTemporaryFile(dir='/tmp', prefix='keyring3', suffix='.keyring') as tmpfile3:
                    tmpfile1.write('[client.rgw]\n')
                    tmpfile1.flush()
                    keyring1 = Keyring(tmpfile1.name)

                    tmpfile2.write('[client.openattic]\n')
                    tmpfile2.flush()
                    keyring2 = Keyring(tmpfile2.name)

                    tmpfile3.write('[mon.]\n[client.admin]\n')
                    tmpfile3.flush()
                    keyring3 = Keyring(tmpfile3.name)

                    keyrings = [keyring1, keyring2, keyring3]

                    sorted_keyrings = sorted(keyrings, key=lambda keyring: sort_by_prioritized_users(keyring.user_name))

                    self.assertIs(sorted_keyrings[0], keyring2)
                    self.assertIs(sorted_keyrings[1], keyring3)
                    self.assertIs(sorted_keyrings[2], keyring1)


class CephPoolTestCase(TestCase):
    mock_context = mock.Mock(fsid='hallo', cluster=ceph.models.CephCluster(name='test', fsid='hallo'))

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_insert(self, monApi_mock, cephpool_objects_mock):
        cephpool_objects_mock.nodb_context = self.mock_context
        nodb.models.NodbManager.nodb_context = self.mock_context

        cephpool_objects_mock.get.return_value = ceph.models.CephPool(id=0, name='test', pg_num=0,
                                                                      type='replicated')

        # Inserting new pool.
        pool = ceph.models.CephPool(name='test', pg_num=0, type='replicated',
                                    erasure_code_profile_id=None)
        pool.save()
        monApi_mock.return_value.osd_pool_create.assert_called_with('test', 0, 0, 'replicated',
                                                                    None)
        cephpool_objects_mock.get.assert_called_with(name='test')
        self.assertFalse(pool._state.adding)

        # Modifying existing pool.
        pool = ceph.models.CephPool(id=0, name='test', pg_num=1, type='replicated')
        pool.save()
        calls = [mock.call('test', 'pg_num', 1, undo_previous_value=0),
                 mock.call('test', 'pgp_num', 1, undo_previous_value=0)]
        monApi_mock.return_value.osd_pool_set.assert_has_calls(calls)

        # Creating a pool tier.
        # FIXME: as get() returns pool with id=0, we cannot really use a different pool here.
        monApi_mock.return_value.osd_pool_set.reset_mock()
        pool = ceph.models.CephPool(id=0, name='test1', pg_num=0, type='replicated',
                                    tier_of=ceph.models.CephPool(id=999, name='test1'))
        pool.save()
        monApi_mock.return_value.osd_tier_add.assert_called_with('test1', 'test1')

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_call_cache_tier(self, monApi_mock, cephpool_objects_mock):
        """
        .. seealso: http://stackoverflow.com/questions/7242433/asserting-successive-calls-to-a-mock-method
        """
        cephpool_objects_mock.nodb_context = self.mock_context
        nodb.models.NodbManager.nodb_context = self.mock_context
        existing_test_pool = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated',
                                                  erasure_code_profile_id=None,
                                                  tier_of_id=None, cache_mode=None)
        cephpool_objects_mock.get.return_value = existing_test_pool

        # Checking the order of different calls.
        pool = ceph.models.CephPool(name='test1', pg_num=0, type='replicated', tier_of_id=1,
                                    tier_of=ceph.models.CephPool(id=1, name="test", cluser_id=None),
                                    cache_mode='writeback',
                                    erasure_code_profile_id=None)
        pool.save()
        calls = [
            mock.call.osd_pool_create('test1', 0, 0, 'replicated', None),
            mock.call.osd_tier_add('test', 'test1'),
            mock.call.osd_tier_cache_mode('test1', 'writeback', undo_previous_mode=None)
        ]
        monApi_mock.return_value.assert_has_calls(calls)

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_call_tier_remove(self, monApi_mock, cephpool_objects_mock):
        """
        Checking the reverse order.
        FIXME: as get() returns pool with id=0, save() cannot determine the original tier_of,
               resulting in weird parameters to osd_tier_remove.
        """
        cephpool_objects_mock.nodb_context = self.mock_context
        nodb.models.NodbManager.nodb_context = self.mock_context

        existing_test_pool = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated',
                                                  cache_mode='writeback', tier_of_id=0,
                                                  tier_of=ceph.models.CephPool(id=0, name='test',
                                                                               pg_num=0,
                                                                               type='replicated'),
                                                  cluser_id=None)

        cephpool_objects_mock.get.return_value = existing_test_pool
        monApi_mock.return_value.reset_mock()
        pool = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated',
                                    cache_mode='none', tier_of=None, tier_of_id=None,
                                    cluser_id=None)
        pool.save()
        calls = [
            mock.call.osd_tier_cache_mode('test', 'none', undo_previous_mode='writeback'),
            mock.call.osd_tier_remove('test', 'test'),
        ]
        monApi_mock.return_value.assert_has_calls(calls)


class UndoFrameworkTest(TestCase):
    class Foo(object):
        def __init__(self):
            self.val = 0

        @undoable
        def add(self, x):
            self.val += x
            yield self.val
            self.val -= x

        @undoable
        def multi(self, x):
            self.val *= x
            yield self.val
            self.val /= x

        @undoable
        def minus(self, x):
            self.val -= x
            yield self.val
            self.add(x)

        @undoable
        def div(self):
            self.val /= 0
            yield self.val
            assert False

    def test_exception(self):
        foo = UndoFrameworkTest.Foo()
        foo.add(100)
        with undo_transaction(foo, NotImplementedError):
            self.assertEqual(foo.val, 100)
            foo.add(4)
            self.assertEqual(foo.val, 104)
            foo.add(2)
            self.assertEqual(foo.val, 106)
            raise NotImplementedError()
        self.assertEqual(foo.val, 100)

    def test_success(self):
        foo = UndoFrameworkTest.Foo()
        foo.add(100)
        self.assertEqual(foo.val, 100)
        with undo_transaction(foo, NotImplementedError):
            self.assertEqual(foo.val, 100)
            self.assertEqual(foo.add(4), 104)
            self.assertEqual(foo.val, 104)
            foo.add(2)
            self.assertEqual(foo.val, 106)
        self.assertEqual(foo.val, 106)

    def test_unknown_exception(self):
        foo = UndoFrameworkTest.Foo()
        try:
            with undo_transaction(foo, NotImplementedError):
                self.assertEqual(foo.val, 0)
                foo.add(4)
                self.assertEqual(foo.val, 4)
                raise ValueError()
        except ValueError:
            self.assertEqual(foo.val, 4)
            return
        self.fail('no exception')

    def test_broken_undo(self):
        foo = UndoFrameworkTest.Foo()
        try:
            with undo_transaction(foo, NotImplementedError):
                foo.add(4)
                self.assertEqual(foo.val, 4)
                foo.multi(0)
                self.assertEqual(foo.val, 0)
                raise NotImplementedError()
        except NotImplementedError:
            self.fail('wrong type')
        except ZeroDivisionError:
            return
        self.fail('no exception')

    def test_undoable_undo(self):
        with undo_transaction(UndoFrameworkTest.Foo(), NotImplementedError) as foo:
            self.assertEqual(foo.val, 0)
            foo.add(4)
            self.assertEqual(foo.val, 4)
            self.assertEqual(foo.minus(1), 3)
            self.assertEqual(foo.val, 3)
            raise NotImplementedError()
        self.assertEqual(foo.val, 0)

    def test_excption_in_func(self):
        foo = UndoFrameworkTest.Foo()
        foo.add(100)
        with undo_transaction(foo, ZeroDivisionError):
            foo.add(4)
            foo.div()
            self.fail('div by 0')
        self.assertEqual(foo.val, 100)

    def test_re_raise(self):
        try:
            with undo_transaction(UndoFrameworkTest.Foo(), ValueError, re_raise_exception=True):
                raise ValueError()
        except ValueError:
            return
        self.fail('no exception')


class LibradosTest(TestCase):
    @mock.patch('ceph.librados.call_librados')
    @mock.patch.object(ceph.librados.MonApi, 'osd_tree')
    def test_osd_tree(self, osd_tree_mock, call_librados_mock):
        tree = [json.loads("""{
            "id": 12,
            "name": "osd.12",
            "type": "osd",
            "type_id": 0,
            "crush_weight": 0.229996,
            "depth": 2,
            "exists": 1,
            "status": "up",
            "reweight": 1,
            "primary_affinity": 1
        }""")] * 3
        tree += [json.loads("""{
            "id": -10,
            "name": "z2-dfs06",
            "type": "host",
            "type_id": 1,
            "children": [12]
        }""")] * 3
        tree += [json.loads("""  {
        "id": -17,
            "name": "z1-dfs",
            "type": "zone",
            "type_id": 2,
            "children": [-10]
        }""")] * 2
        tree += [json.loads("""  {
            "id": -19,
            "name": "sata_raid_bucket",
            "type": "pool",
            "type_id": 3,
            "children": [-17]
        }""")] * 2
        stray = [{
            'id': 5,
            'name': 'osd.5',
            "type": "osd",
            "type_id": 0,
            "crush_weight": 0,
            "depth": 2,
            "exists": 1,
            "status": "down",
            "reweight": 0,
            "primary_affinity": 1
        }] * 2
        osd_tree_mock.return_value = {'nodes': tree, 'stray': stray}
        api = ceph.librados.MonApi('')
        res = api.osd_list()
        self.assertEqual(res, [
            {
                "id": 12,
                "name": "osd.12",
                "type": "osd",
                "type_id": 0,
                "crush_weight": 0.229996,
                "exists": 1,
                "status": "up",
                "reweight": 1,
                "primary_affinity": 1,
            }, {
                'id': 5,
                'name': 'osd.5',
                "type": "osd",
                "type_id": 0,
                "crush_weight": 0,
                "exists": 1,
                "status": "down",
                "reweight": 0,
                "primary_affinity": 1
            }
        ])

    @mock.patch('ceph.librados.call_librados')
    @mock.patch.object(ceph.librados.MonApi, 'osd_tree')
    @mock.patch('ceph.models.librados.MonApi', autospec=True)
    def test_ceph_osd_list(self, librados_monApi_mock, osd_tree_mock, call_librados_mock):
        with open_testdata("tests/ceph-osd-dump.json") as f:
            osd_dump = json.load(f)
            librados_monApi_mock.return_value.osd_dump.return_value = osd_dump
        with open_testdata("tests/ceph-osd-tree.json") as f:
            osd_tree = json.load(f)
            librados_monApi_mock.return_value.osd_tree.return_value = osd_tree
            osd_tree_mock.return_value = osd_tree
        with open_testdata("tests/ceph-osd-metadata.json") as f:
            osd_metadata = json.load(f)
            librados_monApi_mock.return_value.osd_metadata.return_value = osd_metadata
        librados_monApi_mock.return_value.pg_dump.return_value = {
            'osd_stats': [{'osd': i} for i in range(15) if i != 3 and i != 10]
        }

        class Ctx:
            fsid = ''
        osds = ceph.models.CephOsd.get_all_objects(Ctx(), None)
        names = [osd.name for osd in osds]
        self.assertEqual(names, [u'osd.0', u'osd.1', u'osd.2', u'osd.4', u'osd.5', u'osd.6',
                                 u'osd.7', u'osd.8', u'osd.9', u'osd.11', u'osd.12', u'osd.13',
                                 u'osd.14', u'osd.15'])


class CephPgTest(TestCase):

    def test_pool_name(self):
        query = ceph.models.CephPg.objects.filter(pool_name__exact='poolname').query
        cmd = ceph.models.CephPg.get_mon_command_by_query(query)
        self.assertEqual(cmd, ('pg ls-by-pool', {'poolstr': 'poolname'}))

    def test_osd_id(self):
        query = ceph.models.CephPg.objects.filter(osd_id__exact=42).query
        cmd = ceph.models.CephPg.get_mon_command_by_query(query)
        self.assertEqual(cmd,  ('pg ls-by-osd', {'osd': '42'}))


class TrackPgCreationTest(TestCase):
    def test_percent(self):
        data = \
            [
                (0, 10, 5, 50),
                (0, 10, 0, 0),
                (0, 10, 10, 100),
                (10, 20, 10, 0),
                (10, 20, 15, 50),
                (10, 20, 20, 100),
                (10, 20, 0, 0),
                (10, 20, 30, 100),
            ]
        for before, after, current, percent in data:
            result = track_pg_creation.percent('', 0, before, after, current)
            self.assertEqual(result, percent)


class CephPoolSerializerTest(TestCase):
    minimal_replicated_pool = {'name': 'pool_name', 'pg_num': 5,
                               'type': 'replicated', 'crush_ruleset': 0, 'size': 1, 'min_size': 1}
    minimal_ersaure_pool = {'name': 'erasure_coded_pool', 'erasure_code_profile': 'default',
                            'type': 'erasure', 'pg_num': 3, 'crush_ruleset': 0}

    mock_context = mock.Mock(fsid='hallo', cluster=ceph.models.CephCluster(name='test', fsid='hallo'))

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.CephErasureCodeProfile.get_all_objects')
    def test_minimum_valid_pools(self, cecpo_mock, cephpool_objects_mock):

        profile = ceph.models.CephErasureCodeProfile(name='default', m=1, k=1)
        cecpo_mock.return_value = [profile]

        cephpool_objects_mock.nodb_context = self.mock_context
        nodb.models.NodbManager.nodb_context = self.mock_context

        for pool in [self.minimal_replicated_pool, self.minimal_ersaure_pool]:

            s = CephPoolSerializer(data=pool)
            self.assertTrue(s.is_valid(), 'pool={} errors={}'.format(pool, s.errors))

            for key in pool.keys():
                obj = {k: v for k, v in pool.items() if k != key}
                s = CephPoolSerializer(data=obj)
                if key in ['size', 'min_size', 'name', 'erasure_code_profile']:
                    self.assertFalse(s.is_valid(), 'key={} pool={}'.format(key, obj))
                    self.assertIn(key, s.errors)
                else:
                    self.assertTrue(s.is_valid(), 'pool={} errors={}'.format(pool, s.errors))


class JsonFieldFilterTest(TestCase):

    class JsonFieldListFilterModel(nodb.models.NodbModel):
        my_list = nodb.models.JsonField(base_type=list, primary_key=True)

        @staticmethod
        def get_all_objects(context, query):
            return [JsonFieldFilterTest.JsonFieldListFilterModel(my_list=['a', 'b']),
                    JsonFieldFilterTest.JsonFieldListFilterModel(my_list=['b', 'c']),
                    JsonFieldFilterTest.JsonFieldListFilterModel(my_list=['z'])]

    class JsonFieldObjectFilterModel(nodb.models.NodbModel):
        my_object_list = nodb.models.JsonField(base_type=list, primary_key=True)

        @staticmethod
        def get_all_objects(context, query):
            return [JsonFieldFilterTest.JsonFieldObjectFilterModel(my_object_list={'attr1': a1, 'attr2': a2})
                    for (a1, a2) in
                    [('a', 'b'), ('b', 'a'), ('x', 'y'), ('x', 'y'), ('a', 'y'), ('b', 'k'), ('a', 'i')]]

    def test_list_icontains(self):
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(my_list__icontains='a')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(my_list__icontains='x')), 0)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(my_list__icontains='b')), 2)

    def test_object_icontains(self):
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='a')), 3)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='b')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='x')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='o')), 0)

        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='y')), 3)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='a')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='b')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='i')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='o')), 0)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr2='x')), 0)

        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='x',
                                                                              my_object_list__attr2='y')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='a',
                                                                              my_object_list__attr2='b')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(my_object_list__attr1='a',
                                                                              my_object_list__attr2='z')), 0)


class CephRbdTestCase(TestCase):

    @mock.patch('nodb.models.NodbManager.nodb_context', fsid='hallo')
    @mock.patch('ceph.models.RbdApi', **{'return_value._undo_stack': None})
    @mock.patch('ceph.models.CephPool.get_all_objects')
    @mock.patch('ceph.models.CephRbd.get_all_objects')
    def rbd_save_no_features(self, rbd_get_all_objects_mock, pool_get_all_objects_mock, rbd_api_mock, nodb_context_moc):
        """
        Regression test for https://tracker.openattic.org/browse/OP-2506
        Creating an RBD without features causes an error
        """
        pool = ceph.models.CephPool(name='pool', id=1)
        rbd = ceph.models.CephRbd(pool=pool, name='rbd')
        pool_get_all_objects_mock.return_value = [pool]
        rbd_get_all_objects_mock.return_value = [rbd]  # needed to fake successful `RbdApi.create()`
        rbd.save()


class CallLibradosTestCase(TestCase):
    def test_simple(self):
        def return1():
            return 1

        self.assertEqual(ceph.librados.run_in_external_process(return1), 1)

    def test_huge(self):
        def return_big():
            return 'x' * (1024 * 1024)

        self.assertEqual(ceph.librados.run_in_external_process(return_big), return_big())

    def test_exception(self):
        def raise_exception():
            raise KeyError()

        self.assertRaises(KeyError,
                          lambda: ceph.librados.run_in_external_process(raise_exception))

    def test_exit(self):
        def just_exit():
            # NOTE: sys.exit(0) used to work here. No idea why it did work, because ...
            import os
            os._exit(0)

        # ... multiprocessing seems to have a bug where we end up in a timeout, if the child
        # died prematurely.
        self.assertRaises(ceph.librados.ExternalCommandError,
                          lambda: ceph.librados.run_in_external_process(just_exit, timeout=1))

    def test_timeout(self):
        def just_wait():
            import time
            time.sleep(3)

        self.assertRaises(ceph.librados.ExternalCommandError,
                          lambda: ceph.librados.run_in_external_process(just_wait, timeout=1))


class PerformanceTaskTest(TestCase):

    @mock.patch('ceph.tasks.librados.RbdApi', **{'return_value._undo_stack': None})
    def test_simple(self, RbdApi_mock):
        retval = {u'name': u'myrbd', u'provisioned_size': 1073741824, u'used_size': 0}
        RbdApi_mock.return_value.image_disk_usage.return_value = retval
        res = ceph.tasks.get_rbd_performance_data.call_now("3d693c97-d0e7-41d2-87e4-979fa4ebd10a",
                                                           "mypool", "myrbd")
        data, time = res
        self.assertEqual(data, retval)

    @mock.patch('ceph.tasks.librados.RbdApi', **{'return_value._undo_stack': None})
    def test_exception(self, RbdApi_mock):
        RbdApi_mock.return_value.image_disk_usage.side_effect \
            = ceph.librados.ExternalCommandError('foo')
        res = ceph.tasks.get_rbd_performance_data.call_now("3d693c97-d0e7-41d2-87e4-979fa4ebd10a",
                                                           "mypool", "myrbd")
        data, time = res
        self.assertEqual(data, {})


class OsdPoolDeleteTest(TestCase):
    @mock.patch('ceph.librados.call_librados')
    def test_delete_allowed(self, call_librados_mock):
        client_mock = mock.MagicMock(spec=ceph.librados.Client)
        call_librados_mock.side_effect = lambda fsid, func: func(client_mock)
        api = ceph.librados.MonApi('fsid')
        api.osd_pool_delete('name', 'name', '--yes-i-really-really-mean-it')
        self.assertTrue(client_mock.mon_command.called)
        self.assertEqual(client_mock.mon_command.mock_calls, [mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it', 'pool': 'name'}, output_format='string')])


    @mock.patch('ceph.librados.call_librados')
    def test_delete_forbidden(self, call_librados_mock):
        client_mock = mock.MagicMock(spec=ceph.librados.Client)
        call_librados_mock.side_effect = lambda fsid, func: func(client_mock)

        client_mock.mon_command.side_effect = [
            ceph.librados.ExternalCommandError('mon_allow_pool_delete', cmd="cmd", code=EPERM),
            {'mons': [{'name': n} for n in ['a', 'b', 'c']]},  # mon dump
            '', '', '',  # replies from  injected_args
            '',  # pool delete
            '', '', '',  # replies from  injected_args
        ]

        api = ceph.librados.MonApi('fsid')
        api.osd_pool_delete('name', 'name', '--yes-i-really-really-mean-it')
        self.assertTrue(client_mock.mon_command.called)
        print client_mock.mon_command.mock_calls
        calls = [
            mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it', 'pool': 'name'}, output_format='string'),
            mock.call('mon dump'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']}, output_format='string', target='a'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']}, output_format='string', target='b'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']}, output_format='string', target='c'),
            mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it', 'pool': 'name'}, output_format='string'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']}, output_format='string', target='a'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']}, output_format='string', target='b'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']}, output_format='string', target='c')
        ]

        self.assertEqual(client_mock.mon_command.mock_calls, calls)
