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

import mock
from django.db import models

from django.db.models import Q
from django.test import TestCase

from nodb.models import NodbQuerySet, NodbModel, JsonField, LazyProperty
from nodb.restapi import NodbSerializer


class QuerySetTestCase(TestCase):

    @classmethod
    def setUpClass(cls):
        class CephClusterMock(NodbModel):

            @staticmethod
            def get_all_objects(context, query):
                cluster1 = mock.MagicMock()
                cluster1.fsid = 'e79f3338-f9e4-4656-8af3-7af7357fcd09'
                cluster1.name = 'ceph'

                cluster2 = mock.MagicMock()
                cluster2.fsid = 'e90a0c5a-5caa-405a-bc09-a7cfd1874243'
                cluster2.name = 'vinara'

                cluster3 = mock.MagicMock()
                cluster3.fsid = 'kd89g3lf-sed4-j986-asd3-akf84nchazeb'
                cluster3.name = 'balkan'

                return [cluster1, cluster2, cluster3]

        cls.qs = NodbQuerySet(CephClusterMock)

        class OrderTestModel(NodbModel):
            x = models.IntegerField(primary_key=True)
            y = models.IntegerField()

            @staticmethod
            def get_all_objects(context, query):
                return [cls.ordering_a, cls.ordering_b, cls.ordering_c]

        cls.ordering_a = OrderTestModel(x=1, y=1)
        cls.ordering_b = OrderTestModel(x=1, y=2)
        cls.ordering_c = OrderTestModel(x=2, y=2)


        cls.order_qs = NodbQuerySet(OrderTestModel)

    def test_kwargs_filter_by_name(self):
        filter_result = self.qs.filter(name='balkan')

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'balkan')
        self.assertEqual(filter_result[0].fsid, 'kd89g3lf-sed4-j986-asd3-akf84nchazeb')

    def test_kwargs_filter_by_id(self):
        filter_result = self.qs.filter(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd09')

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'ceph')
        self.assertEqual(filter_result[0].fsid, 'e79f3338-f9e4-4656-8af3-7af7357fcd09')

    def test_kwargs_filter_name_not_found(self):
        filter_result = self.qs.filter(name='notfound')

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_by_name(self):
        filter_params = Q(name__icontains='vin')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'vinara')
        self.assertEqual(filter_result[0].fsid, 'e90a0c5a-5caa-405a-bc09-a7cfd1874243')

    def test_args_filter_by_id(self):
        filter_params = Q(fsid__icontains='kd89g3lf')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'balkan')
        self.assertEqual(filter_result[0].fsid, 'kd89g3lf-sed4-j986-asd3-akf84nchazeb')

    def test_args_filter_by_name_and_id(self):
        filter_params = Q(fsid__icontains='kd89g3lf') | Q(name__icontains='ce')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 2)

    def test_args_filter_name_not_found(self):
        filter_params = Q(name__icontains='notfound')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_id_not_found(self):
        filter_params = Q(fsid__icontains='notfound')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)

    def test_args_filter_name_id_not_found(self):
        filter_params = Q(name__icontains='namenotfound') | Q(fsid__icontains='idnotfound')
        filter_result = self.qs.filter(filter_params)

        self.assertEqual(len(filter_result), 0)

    def test_exclude(self):
        filter_result = self.qs.exclude(name="balkan")
        self.assertEqual(len(filter_result), 2)

        filter_result = self.qs.filter(Q(name="balkan")).filter(~Q(name="balkan"))
        self.assertEqual(len(filter_result), 0)

    def test_exclude_pk(self):
        filter_result = self.order_qs.filter(pk=1).exclude(pk=1)
        self.assertEqual(len(filter_result), 0)

        filter_result = self.order_qs.filter(x=1).exclude(pk=1)
        self.assertEqual(len(filter_result), 0)

        filter_result = self.order_qs.filter(pk=1)
        self.assertEqual(len(filter_result), 2)

    def test_ordering(self):

        def eq_order(expected, *order):
            ordered = self.order_qs.order_by(*order)
            self.assertEqual([(obj.x, obj.y) for obj in ordered], [(obj.x, obj.y) for obj in expected])

        eq_order([self.ordering_a, self.ordering_b, self.ordering_c], "x", "y")
        eq_order([self.ordering_b, self.ordering_a, self.ordering_c], "x", "-y")
        eq_order([self.ordering_c, self.ordering_a, self.ordering_b], "-x", "y")
        eq_order([self.ordering_c, self.ordering_b, self.ordering_a], "-x", "-y")


class DictFieldSerializerTest(TestCase):

    def test_serializer(self):

        class DictFieldModel(NodbModel):

            @staticmethod
            def get_all_objects(context, query):
                self.fail("should not be called")

            my_dict = JsonField(primary_key=True)

        class DictFieldModelSerializer(NodbSerializer):
            class Meta:
                model = DictFieldModel

        my_dict = {'foo': 'bar', 'baz': 'baaz'}

        serializer = DictFieldModelSerializer(DictFieldModel(my_dict=my_dict))

        self.assertEqual(serializer.data, {'my_dict': my_dict})


class LazyPropertyTest(TestCase):

    def test_simple(self):
        class TestModel(NodbModel):
            a = models.IntegerField()
            b = models.IntegerField()

            @staticmethod
            def get_all_objects(context, query):
                return [
                    TestModel(a=1),
                    TestModel(a=2)
                ]

            @staticmethod
            def get_populate_func(field_name):

                def populate_b(self, objects):
                    for (o, i) in zip(objects, range(2)):
                        o.b = i

                return populate_b

        os = TestModel.objects.all()
        for o in os:
            self.assertIsInstance(o.__dict__['a'], int)
            self.assertIsInstance(o.__dict__['b'], LazyProperty)
        for (o, i) in zip(os, range(2)):
            self.assertEqual(o.b, i)

