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
import doctest
import os
from contextlib import contextmanager
from errno import EPERM

import mock
import tempfile
import json

from configobj import ConfigObj
from django.core.exceptions import ValidationError

import exception
import utilities
from ceph.restapi import CephPoolSerializer
from django.test import TestCase

import ceph.models
import ceph.librados
import ceph.tasks
import ceph.status
import nodb.models

from ceph.librados import Keyring, undoable, undo_transaction, sort_by_prioritized_users
from ceph.tasks import track_pg_creation
from module_status import UnavailableModule


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(ceph.librados))
    tests.addTests(doctest.DocTestSuite(ceph.models))
    return tests


def open_testdata(name):
    return open(os.path.join(os.path.dirname(__file__), name))


@contextmanager
def temporary_keyring(user='client.admin', users=None, content=None):
    if users is None:
        users = [user]
    if content is None:
        content = '\n'.join(['[{}]'.format(u) for u in users])
    with tempfile.NamedTemporaryFile(dir='/tmp', prefix=users[0] + '.',
                                     suffix=".keyring") as tmpfile:
        tmpfile.write(content)
        tmpfile.flush()
        yield tmpfile.name


@contextmanager
def temp_ceph_conf(fsid, keyrings):
    with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph',
                                     suffix=".conf") as tmpfile_ceph_conf:
        obj = ConfigObj()
        obj['global'] = {'fsid': fsid}
        for keyring in keyrings:
            if isinstance(keyring, Keyring):
                users, file_name = keyring.available_user_names, keyring.file_name
            else:
                users, file_name = keyring['available_user_names'], keyring['file_name']
            for user in users:
                obj[user] = {'keyring':  file_name}
        obj.write(outfile=tmpfile_ceph_conf)
        tmpfile_ceph_conf.flush()
        yield tmpfile_ceph_conf.name


class KeyringTestCase(TestCase):
    def test_succeeds(self):
        with temporary_keyring() as file_name:
            keyring = Keyring(file_name)
            self.assertEqual(keyring.available_user_names, ['client.admin'])

    def test_unknown_user(self):
        with temporary_keyring() as file_name:
            keyring = Keyring(file_name, user_name='unknownuser')
            with self.assertRaises(RuntimeError) as context:
                keyring._check_access()
            self.assertIn('unknownuser', str(context.exception))

    def test_does_not_exist(self):
        keyring = Keyring('/does/not/exist')
        with self.assertRaises(RuntimeError) as context:
            keyring._check_access()
        self.assertIn('does not exist', str(context.exception))

    def test_invalid_keyring(self):
        with temporary_keyring(content="abcdef") as file_name:
            keyring = Keyring(file_name)
            with self.assertRaises(RuntimeError) as context:
                keyring._check_access()
            self.assertIn('Corrupt keyring', str(context.exception))

    def test_users_sorting(self):
        with temporary_keyring(users=['mon.', 'client.admin', 'client.rgw', 'client.openattic'])\
                as file_name:
            keyring = Keyring(file_name)
            self.assertEqual(keyring.available_user_names[0], 'client.openattic')
            self.assertEqual(keyring.available_user_names[1], 'client.admin')

    def test_sorting(self):
        with temporary_keyring('client.rgw') as file_name1:
            with temporary_keyring('client.openattic') as file_name2:
                with temporary_keyring(users=['[mon.', 'client.admin']) as file_name3:
                    keyrings = map(Keyring, [file_name1, file_name2, file_name3])

                    sorted_keyrings = sorted(
                        keyrings, key=lambda keyring: sort_by_prioritized_users(keyring.user_name))

                    self.assertIs(sorted_keyrings[0], keyrings[1])
                    self.assertIs(sorted_keyrings[1], keyrings[2])
                    self.assertIs(sorted_keyrings[2], keyrings[0])

    def test_empty_keyring(self):
        with temporary_keyring('client.empty', content='') as file_name_empty:
            with temporary_keyring('client.foo') as file_name_foo:
                with temp_ceph_conf('fsid', [Keyring(file_name_foo),
                                             {'available_user_names': ['client.empty'],
                                              'file_name': file_name_empty}]) as ceph_conf:
                    self.assertEqual(
                        [k.file_name for k in
                         ceph.librados.ClusterConf(file_path=ceph_conf).keyring_candidates],
                        [file_name_foo])




class CephPoolTestCase(TestCase):
    mock_context = mock.Mock(fsid='hallo', cluster=ceph.models.CephCluster(name='test',
                                                                           fsid='hallo'))

    @mock.patch('ceph.models.CephPool.objects')
    @mock.patch('ceph.models.ClusterConf')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_insert(self, monApi_mock, clusterconf_mock, cephpool_objects_mock):
        cephpool_objects_mock.nodb_context = self.mock_context
        clusterconf_mock.all_configs.return_value = [mock.Mock(fsid='hallo', name='test')]

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
    @mock.patch('ceph.models.ClusterConf')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_call_cache_tier(self, monApi_mock, clusterconf_mock, cephpool_objects_mock):
        """
        .. seealso: http://stackoverflow.com/questions/7242433/asserting-successive-calls-to-a-mock-method
        """
        cephpool_objects_mock.nodb_context = self.mock_context
        clusterconf_mock.all_configs.return_value = [mock.Mock(fsid='hallo', name='test')]
        existing_test_pool = ceph.models.CephPool(id=0, name='test', pg_num=0, type='replicated',
                                                  erasure_code_profile_id=None,
                                                  tier_of_id=None, cache_mode=None)
        cephpool_objects_mock.get.return_value = existing_test_pool

        # Checking the order of different calls.
        pool = ceph.models.CephPool(name='test1', pg_num=0, type='replicated', tier_of_id=1,
                                    tier_of=ceph.models.CephPool(id=1, name="test"),
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
    @mock.patch('ceph.models.ClusterConf')
    @mock.patch('ceph.models.MonApi', autospec=True)
    def test_call_tier_remove(self, monApi_mock, clusterconf_mock, cephpool_objects_mock):
        """
        Checking the reverse order.
        FIXME: as get() returns pool with id=0, save() cannot determine the original tier_of,
               resulting in weird parameters to osd_tier_remove.
        """
        cephpool_objects_mock.nodb_context = self.mock_context
        clusterconf_mock.all_configs.return_value = [mock.Mock(fsid='hallo', name='test')]

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

    def test_calc_pool_percent_used_luminous(self):
        df_data_pool = dict(bytes_used=157286400, percent_used=25)

        percent_used = ceph.models.CephPool._calc_percent_used(None, None, df_data_pool)
        self.assertEqual(df_data_pool['percent_used'], percent_used)

    def test_calc_pool_percent_used_replicated_jewel(self):
        pool = mock.Mock(size=3, type='replicated')
        df_data_global = dict(total_bytes=629145600)
        df_data_pool = dict(bytes_used=157286400, raw_bytes_used=471859200)

        percent_used = ceph.models.CephPool._calc_percent_used(pool, df_data_global, df_data_pool)
        self.assertEqual(percent_used, 25)

    def test_calc_pool_percent_used_erasurecode_jewel(self):
        pool = mock.Mock(size=3, type='erasure', erasure_code_profile=mock.Mock(m=1, k=2))
        df_data_global = dict(total_bytes=629145600)
        df_data_pool = dict(bytes_used=157286400, raw_bytes_used=471859200)

        percent_used = ceph.models.CephPool._calc_percent_used(pool, df_data_global, df_data_pool)
        self.assertEqual(percent_used, 50)


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

    def test_config_migration(self):
        utilities.write_single_setting('CEPH_KEYRING_USER_FSID-WITH-MINUS', 'dummy')
        self.assertEqual(utilities.read_single_setting('CEPH_KEYRING_USER_FSID-WITH-MINUS'),
                         'dummy')

        utilities.write_single_setting('CEPH_KEYRING_USER_FSID_WITH_MINUS', '')


        obj = mock.Mock()
        ceph.librados._read_oa_settings(ConfigObj(ceph.librados.oa_settings.settings_file), obj)

        self.assertNotIn('CEPH_KEYRING_USER_FSID-WITH-MINUS', obj.__dict__)
        self.assertEqual(obj.CEPH_KEYRING_USER_FSID_WITH_MINUS, 'dummy')
        self.assertEqual(utilities.read_single_setting('CEPH_KEYRING_USER_FSID-WITH-MINUS'),
                         'dummy')

        ceph.librados._write_oa_setting('CEPH_KEYRING_USER_FSID_WITH_MINUS', 'dummy2')
        with self.assertRaises(KeyError):
            utilities.read_single_setting('CEPH_KEYRING_USER_FSID-WITH-MINUS')

        self.assertEqual(utilities.read_single_setting('CEPH_KEYRING_USER_FSID_WITH_MINUS'),
                         'dummy2')


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

    mock_context = mock.Mock(fsid='hallo', cluster=ceph.models.CephCluster(name='test',
                                                                           fsid='hallo'))

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
            return [JsonFieldFilterTest.JsonFieldObjectFilterModel(my_object_list={'attr1': a1,
                                                                                   'attr2': a2})
                    for (a1, a2) in
                    [('a', 'b'), ('b', 'a'), ('x', 'y'), ('x', 'y'), ('a', 'y'), ('b', 'k'),
                     ('a', 'i')]]

    def test_list_icontains(self):
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(
                my_list__icontains='a')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(
                my_list__icontains='x')), 0)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldListFilterModel.objects.filter(
                my_list__icontains='b')), 2)

    def test_object_icontains(self):
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='a')), 3)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='b')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='x')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='o')), 0)

        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='y')), 3)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='a')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='b')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='i')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='o')), 0)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr2='x')), 0)

        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='x', my_object_list__attr2='y')), 2)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='a', my_object_list__attr2='b')), 1)
        self.assertEqual(
            len(JsonFieldFilterTest.JsonFieldObjectFilterModel.objects.filter(
                my_object_list__attr1='a', my_object_list__attr2='z')), 0)


class CephRbdTestCase(TestCase):

    @mock.patch('nodb.models.NodbManager.nodb_context', fsid='hallo')
    @mock.patch('ceph.models.RbdApi', **{'return_value._undo_stack': None})
    @mock.patch('ceph.models.CephPool.get_all_objects')
    @mock.patch('ceph.models.CephRbd.get_all_objects')
    def test_rbd_save_no_features(self, rbd_get_all_objects_mock, pool_get_all_objects_mock,
                                  rbd_api_mock, nodb_context_moc):
        """
        Regression test for https://tracker.openattic.org/browse/OP-2506
        Creating an RBD without features causes an error
        """
        pool = ceph.models.CephPool(name='pool', id=1, cluster=ceph.models.CephCluster(name='name',
                                                                                       fsid='fsid'))
        rbd = ceph.models.CephRbd(pool=pool, name='rbd')
        pool_get_all_objects_mock.return_value = [pool]
        rbd_get_all_objects_mock.return_value = [rbd]  # needed to fake successful `RbdApi.create()`
        rbd.save()

    @mock.patch('nodb.models.NodbManager.nodb_context', fsid='hallo')
    @mock.patch('ceph.models.RadosMixin')
    @mock.patch('ceph.models.CephPool.get_all_objects')
    def test_rbd_assert_lazy(self, pool_get_all_objects_mock,
                             RadosMixing_mock, nodb_context_moc):
        """
        We have to make sure, all interesting fields are lazy evaluated. Otherwise listing
        them is too slow.
        """
        pool_get_all_objects_mock.return_value = [ceph.models.CephPool(name='pool', id=1)]
        RadosMixing_mock.rbd_api.return_value.list.return_value = ['rbd1']
        rbd = ceph.models.CephRbd.objects.get()
        self.assertEqual(rbd.name, 'rbd1')
        for field in ['num_objs', 'obj_size', 'size', 'data_pool_id', 'features', 'old_format',
                      'used_size', 'stripe_unit', 'stripe_count']:
            self.assertTrue(rbd.attribute_is_unevaluated_lazy_property(field),
                            '{} is already evaluated'.format(field))


class TaskTest(TestCase):

    @mock.patch('ceph.librados.rbd.RBD')
    @mock.patch('ceph.librados.RbdApi._call_librados')
    @mock.patch('ceph.librados.ClusterConf.from_fsid')
    def test_rbd_delete_task(self, from_fsid_mock, call_librados_mock, RBD_mock):

        pool_name = 'pool-name'
        image_name = 'image-name'

        ioctx = mock.Mock()
        client_mock = mock.Mock()
        client_mock.get_pool.return_value = ioctx

        call_librados_mock.side_effect = lambda fn, timeout: fn(client_mock)

        task = ceph.tasks.delete_rbd('fsid', pool_name, image_name)
        task.run_once()

        self.assertEqual(client_mock.mock_calls, [mock.call.get_pool(pool_name)])
        RBD_mock.assert_has_calls([mock.call().remove(ioctx, 'image-name')], any_order=True)


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
            = exception.ExternalCommandError('foo')
        res = ceph.tasks.get_rbd_performance_data.call_now("3d693c97-d0e7-41d2-87e4-979fa4ebd10a",
                                                           "mypool", "myrbd")
        data, time = res
        self.assertEqual(data, {})


class OsdPoolDeleteTest(TestCase):
    @mock.patch('ceph.librados.call_librados')
    def test_delete_allowed(self, call_librados_mock):
        client_mock = mock.MagicMock(spec=ceph.librados.Client)
        call_librados_mock.side_effect = lambda fsid, func, cmd: func(client_mock)
        api = ceph.librados.MonApi('fsid')
        api.osd_pool_delete('name', 'name', '--yes-i-really-really-mean-it')
        self.assertTrue(client_mock.mon_command.called)
        self.assertEqual(client_mock.mon_command.mock_calls, [
            mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it',
                                          'pool': 'name'}, output_format='string')])

    @mock.patch('ceph.librados.call_librados')
    def test_delete_forbidden(self, call_librados_mock):
        client_mock = mock.MagicMock(spec=ceph.librados.Client)
        call_librados_mock.side_effect = lambda fsid, func, cmd: func(client_mock)

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
        calls = [
            mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it',
                                          'pool': 'name'}, output_format='string'),
            mock.call('mon dump'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']},
                      output_format='string', target='a'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']},
                      output_format='string', target='b'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=true']},
                      output_format='string', target='c'),
            mock.call('osd pool delete', {'pool2': 'name', 'sure': '--yes-i-really-really-mean-it',
                                          'pool': 'name'}, output_format='string'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']},
                      output_format='string', target='a'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']},
                      output_format='string', target='b'),
            mock.call('injectargs', {'injected_args': ['--mon-allow-pool-delete=false']},
                      output_format='string', target='c')
        ]

        self.assertEqual(client_mock.mon_command.mock_calls, calls)


class CephClusterTestCase(TestCase):
    @mock.patch('ceph.models.MonApi')
    def test_pause_flag(self, MonApi_mock):
        MonApi_mock.return_value.osd_dump.return_value = {
            'flags': 'pauserd,pausewr,sortbitwise,recovery_deletes'
        }
        self.assertEqual(set(ceph.models.CephCluster(fsid='fsid').osd_flags), {
            'pause', 'sortbitwise', 'recovery_deletes'
        })

    def test_clean_keyring_file_path(self):
        cluster = ceph.models.CephCluster(config_file_path='/does/not/exist',
                                          keyring_file_path='/does/not/exist')
        with self.assertRaises(ValidationError) as context:
            cluster.clean()
        self.assertIn('keyring_file_path', context.exception.error_dict)

    def test_clean_keyring_user(self):
        with temporary_keyring() as file_name:
            cluster = ceph.models.CephCluster(config_file_path='/does/not/exist',
                                              keyring_file_path=file_name,
                                              keyring_user='unknownuser')
            with self.assertRaises(ValidationError) as context:
                cluster.clean()
            self.assertIn('keyring_user', context.exception.error_dict)

    def test_clean(self):
        with temporary_keyring() as file_name:
            cluster = ceph.models.CephCluster(config_file_path='/does/not/exist',
                                              keyring_file_path=file_name,
                                              keyring_user='client.admin')
            cluster.clean()

    def test_keyring_candidates(self):
        with temporary_keyring(users=['client.admin', 'client.openattic']) as keyring_path:
            with temp_ceph_conf('fsid', [Keyring(keyring_path)]) as ceph_conf:
                cluster = ceph.models.CephCluster.from_cluster_conf(ceph.librados.ClusterConf(ceph_conf))
                self.assertEqual(cluster.keyring_candidates, [{
                    'file-path': keyring_path,
                    'user-names': ['client.openattic', 'client.admin']
                }])

    @mock.patch('ceph.models.NodbModel.get_modified_fields')
    @mock.patch('ceph.models.MonApi._call_mon_command')
    @mock.patch('ceph.librados._write_oa_setting')
    def test_save(self, _write_oa_setting_mock, _call_mon_command_mock, get_modified_fields_mock):
        with temporary_keyring(users=['client.admin', 'client.openattic']) as keyring_path:
            with temp_ceph_conf('f-s-i-d', [Keyring(keyring_path)]) as ceph_conf:
                cluster = ceph.models.CephCluster.from_cluster_conf(ceph.librados.ClusterConf(ceph_conf))
                get_modified_fields_mock.return_value = ({
                                                            'keyring_file_path': 'new_path',
                                                            'keyring_user': 'client.admin',
                                                            'osd_flags': ['a', 'b'],
                                                         }, mock.Mock(osd_flags=['a', 'c']))
                cluster.keyring_file_path = 'new_path'
                cluster.keyring_user = 'client.admin'
                cluster.osd_flags = ['a', 'b']

                cluster.save(force_update=True)
                self.assertEqual(_write_oa_setting_mock.mock_calls, [
                    mock.call('CEPH_KEYRING_USER_F_S_I_D', 'client.admin'),
                    mock.call('CEPH_KEYRING_F_S_I_D', 'new_path')
                ])
                self.assertEqual(_call_mon_command_mock.mock_calls, [
                    mock.call('osd unset', {'key': 'c'}, output_format='string'),
                    mock.call('osd set', {'key': 'b'}, output_format='string')
                ])



class CephOsdTestCase(TestCase):

    def test_save(self):
        with self.assertRaises(ValidationError):
            ceph.models.CephOsd(cluster=ceph.models.CephCluster()).save()

    @mock.patch('ceph.models.NodbModel.get_modified_fields')
    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_save_osd_in(self, _call_mon_command_mock, get_modified_fields_mock):
        get_modified_fields_mock.return_value = ({'in_state': 1}, None)
        ceph.models.CephOsd(cluster=ceph.models.CephCluster(),
                            id=1,
                            name='name').save()
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd in', {'name': 'name'}, output_format='string')
        ])

    @mock.patch('ceph.models.NodbModel.get_modified_fields')
    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_save_osd_out(self, _call_mon_command_mock, get_modified_fields_mock):
        get_modified_fields_mock.return_value = ({'in_state': 0}, None)
        ceph.models.CephOsd(cluster=ceph.models.CephCluster(), id=1, name='name').save()
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd out', {'name': 'name'}, output_format='string')
        ])

    @mock.patch('ceph.models.NodbModel.get_modified_fields')
    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_save_reweight(self, _call_mon_command_mock, get_modified_fields_mock):
        get_modified_fields_mock.return_value = ({'reweight': 42}, mock.Mock(reweight=0))
        ceph.models.CephOsd(cluster=ceph.models.CephCluster(), id=1, name='name').save()
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd crush reweight', {'name': 'name', 'weight': 42}, output_format='string')
        ])

    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_scrub(self, _call_mon_command_mock):
        osd = ceph.models.CephOsd(cluster=ceph.models.CephCluster(), id=1, name='name')
        osd.scrub(False)
        osd.scrub(True)
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd scrub', {'who': 'name'}, output_format='string'),
            mock.call('osd deep-scrub', {'who': 'name'}, output_format='string')
        ])


class CephErasureCodeProfileTestCase(TestCase):

    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_save(self, _call_mon_command_mock):
        ecp = ceph.models.CephErasureCodeProfile(k=3, m=3, name='test',
                                                 ruleset_failure_domain='rack')
        ecp._context = mock.Mock(fsid='fsid')
        ecp.save(force_insert=True)
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd erasure-code-profile set',
                      {'profile': ['k=3', 'm=3', 'crush-failure-domain=rack'], 'name': 'test'},
                      output_format='string')
        ])

    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_delete(self, _call_mon_command_mock):
        ecp = ceph.models.CephErasureCodeProfile(name='test')
        ecp._context = mock.Mock(fsid='fsid')
        ecp.delete()
        self.assertEqual(_call_mon_command_mock.mock_calls, [
            mock.call('osd erasure-code-profile rm',
                      {'name': 'test'},
                      output_format='string')
        ])

    @mock.patch('ceph.models.MonApi._call_mon_command')
    def test_get_all_objects(self, _call_mon_command_mock):
        def side_effect(prefix, *a, **kw):
            return {
                'osd erasure-code-profile ls': ['test'],
                'osd erasure-code-profile get': {'k': 3, 'm': 3, 'plugin': 'jrasure',
                                                 'technique': 'technique',
                                                 'jerasure-per-chunk-alignment': 'align',
                                                 'crush-failure-domain': 'rack',
                                                 'crush-root': 'root', 'w': 1}
            }[prefix]
        _call_mon_command_mock.side_effect = side_effect
        nodb.models.NodbManager.set_nodb_context(mock.Mock(fsid='fsid'))
        ecp = ceph.models.CephErasureCodeProfile.objects.get()
        self.assertEqual(ecp.name, 'test')
        self.assertEqual(ecp.k, 3)
        self.assertEqual(ecp.m, 3)
        self.assertEqual(ecp.ruleset_failure_domain, 'rack')
        self.assertEqual(ecp.ruleset_root, 'root')


class StatusTestCase(TestCase):
    def test_keyring(self):
        with self.assertRaises(UnavailableModule):
            ceph.status.check_keyring_permission(ceph.librados.Keyring('/does/not/exist'))

    @mock.patch('ceph.status.call_librados')
    @mock.patch('ceph.status.ClusterConf')
    def test_api_not_connected(self, ClusterConf_mock, call_librados_mock):
        client_mock = mock.Mock(**{'connected.return_value': False})
        call_librados_mock.side_effect = lambda fsid, func, cmd: func(client_mock)
        ClusterConf_mock.from_fsid.return_value.name = 'name'
        with self.assertRaises(UnavailableModule):
            ceph.status.check_ceph_api('fsid')

    @mock.patch('ceph.status.call_librados')
    @mock.patch('ceph.status.ClusterConf')
    def test_api_connected(self, ClusterConf_mock, call_librados_mock):
        client_mock = mock.Mock(**{'connected.return_value': True})
        call_librados_mock.side_effect = lambda fsid, func, cmd: func(client_mock)
        ClusterConf_mock.from_fsid.return_value.name = 'name'
        self.assertIsNone(ceph.status.check_ceph_api('fsid'))

    @mock.patch('ceph.status.call_librados')
    @mock.patch('ceph.status.ClusterConf')
    def test_api_timeout(self, ClusterConf_mock, call_librados_mock):
        call_librados_mock.side_effect = exception.ExternalCommandError('x')
        ClusterConf_mock.from_fsid.return_value.name = 'name'
        with self.assertRaises(UnavailableModule):
            ceph.status.check_ceph_api('fsid')

    @mock.patch('ceph.status.call_librados')
    @mock.patch('ceph.status.ClusterConf')
    def test_api_no_cluster(self, ClusterConf_mock, call_librados_mock):
        client_mock = mock.Mock(**{'connected.return_value': False})
        call_librados_mock.side_effect = lambda fsid, func: func(client_mock)
        ClusterConf_mock.from_fsid.side_effect = LookupError()
        with self.assertRaises(UnavailableModule):
            ceph.status.check_ceph_api('fsid')
