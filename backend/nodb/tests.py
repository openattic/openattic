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

from django.core.exceptions import ValidationError
from django.db import models

from django.db.models import Q, CharField
from django.test import TestCase
from django_filters import FilterSet

from nodb.models import NodbQuerySet, NodbModel, JsonField, bulk_attribute_setter
from nodb.restapi import NodbSerializer
from rest.utilities import CommaSeparatedValueFilter


class QuerySetTestCase(TestCase):

    @classmethod
    def setUpClass(cls):
        super(QuerySetTestCase, cls).setUpClass()

        class CephClusterMock(NodbModel):

            name = CharField(max_length=100)
            fsid = CharField(max_length=100)

            @staticmethod
            def get_all_objects(context, query):
                return [
                    CephClusterMock(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd09', name='ceph'),
                    CephClusterMock(fsid='e90a0c5a-5caa-405a-bc09-a7cfd1874243', name='vinara'),
                    CephClusterMock(fsid='kd89g3lf-sed4-j986-asd3-akf84nchazeb', name='balkan'),
                ]

            def __str__(self):
                return self.name

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

        class EmptyModel(NodbModel):

            @staticmethod
            def get_all_objects(context, query):
                return []

        cls.empty_qs = NodbQuerySet(EmptyModel)

    def test_kwargs_filter_by_name(self):
        filter_result = self.qs.filter(name='balkan')

        self.assertEqual(len(filter_result), 1)
        self.assertEqual(filter_result[0].name, 'balkan')
        self.assertEqual(filter_result[0].fsid, 'kd89g3lf-sed4-j986-asd3-akf84nchazeb')

    def test_filter_or(self):
        filter_result = self.qs.filter(Q(name='ceph') | Q(name='balkan'))
        self.assertEqual(len(filter_result), 2)

        filter_result = self.qs.filter(Q() | Q(name='ceph') | Q(name='balkan'))
        self.assertEqual(len(filter_result), 2)

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
            self.assertEqual([(obj.x, obj.y) for obj in ordered],
                             [(obj.x, obj.y) for obj in expected])

        eq_order([self.ordering_a, self.ordering_b, self.ordering_c], "x", "y")
        eq_order([self.ordering_b, self.ordering_a, self.ordering_c], "x", "-y")
        eq_order([self.ordering_c, self.ordering_a, self.ordering_b], "-x", "y")
        eq_order([self.ordering_c, self.ordering_b, self.ordering_a], "-x", "-y")

    def test_nonzero(self):
        self.assertTrue(bool(self.qs))
        self.assertFalse(bool(self.empty_qs))

    def test_filter_in(self):

        class NameInFilterSet(FilterSet):
            name_in = CommaSeparatedValueFilter(name='name', lookup_type='in')

            class Meta:
                model = self.qs.model
                fields = 'name',

        self.assertEqual(NameInFilterSet({'name': 'ceph'}, self.qs).qs[0].name, 'ceph')

        qs = NameInFilterSet({'name_in': 'ceph,balkan'}, self.qs).qs
        self.assertEqual(len(qs), 2)


class DictFieldSerializerTest(TestCase):

    def test_serializer(self):

        class DictFieldModel(NodbModel):

            @staticmethod
            def get_all_objects(context, query):
                self.fail("should not be called")

            my_dict = JsonField(base_type=list, primary_key=True)

        class DictFieldModelSerializer(NodbSerializer):
            class Meta:
                model = DictFieldModel

        my_dict = {'foo': 'bar', 'baz': 'baaz'}

        serializer = DictFieldModelSerializer(DictFieldModel(my_dict=my_dict))

        self.assertEqual(serializer.data, {'my_dict': my_dict})

    def test_nullable(self):
        class DictFieldModel2(NodbModel):
            non_nullable = JsonField(base_type=list, primary_key=True)
            nullable = JsonField(base_type=dict, primary_key=True, blank=True, null=True)
            blank = JsonField(base_type=list, blank=True)

            @staticmethod
            def get_all_objects(context, query):
                return []

        m = DictFieldModel2(non_nullable=[1], nullable=None, blank=[])
        m.full_clean()
        self.assertIsNone(m.nullable)
        self.assertEqual(m.blank, [])
        self.assertEqual(m.non_nullable, [1])

        try:
            m2 = DictFieldModel2(non_nullable=[], nullable=None, blank=[])
            m2.full_clean()
            self.fail()
        except ValidationError:
            pass

        try:
            m2 = DictFieldModel2(non_nullable=[1], nullable=None, blank=None)
            m2.full_clean()
            self.fail()
        except ValidationError:
            pass


class LazyPropertyTest(TestCase):

    class TestModel(NodbModel):
        a = models.IntegerField(primary_key=True)
        b = models.IntegerField()
        c = models.IntegerField()
        d = models.IntegerField()
        e = models.IntegerField()

        @bulk_attribute_setter(['b'])
        def set_b(self, objects, field_names):
            assert self in objects
            for o in objects:
                o.b = o.a

        @bulk_attribute_setter(['c'])
        def set_c(self, objects, field_names):
            for o in objects:
                o.c = self.a

        @bulk_attribute_setter(['d', 'e'])
        def set_d_e(self, objects, field_names):
            self.d = self.a
            self.e = self.a

        @staticmethod
        def get_all_objects(context, query):
            return [
                LazyPropertyTest.TestModel(a=1),
                LazyPropertyTest.TestModel(a=2)
            ]

        def __unicode__(self):
            return u'<TestModel {}>'.format(self.a)


    def test_simple(self):
        os = list(LazyPropertyTest.TestModel.objects.all())
        for o in os:
            self.assertIsInstance(o.__dict__['a'], int)
            self.assertTrue(o.attribute_is_unevaluated_lazy_property('b'))
            self.assertTrue(o.attribute_is_unevaluated_lazy_property('c'))
            self.assertTrue(o.attribute_is_unevaluated_lazy_property('d'))
            self.assertTrue(o.attribute_is_unevaluated_lazy_property('e'))

        for o in os:
            self.assertEqual(o.b, o.a)
            self.assertIsInstance(o.__dict__['b'], int)

    def test_filter(self):
        o = LazyPropertyTest.TestModel.objects.all().get(a=2)
        self.assertIsInstance(o.__dict__['a'], int)
        self.assertEqual(o.a, 2)
        self.assertEqual(o.b, 2)
        self.assertIsInstance(o.__dict__['b'], int)

    def test_non_deterministic(self):
        o1, o2 = LazyPropertyTest.TestModel.objects.all()
        self.assertEqual(o2.c, o2.a)
        self.assertEqual(o1.c, o2.a)

    def test_single_row(self):
        o1, o2 = LazyPropertyTest.TestModel.objects.all()
        self.assertNotIn('d', o2.__dict__)
        self.assertEqual(o2.d, o2.a)
        self.assertIn('e', o2.__dict__)
        self.assertNotIn('d', o1.__dict__)
        self.assertNotIn('e', o1.__dict__)

    def test_filter_order_by(self):
        o1 = LazyPropertyTest.TestModel.objects.filter(d=1).order_by('a')[0]
        self.assertEqual(o1.a, 1)
        self.assertIn('d', o1.__dict__)
        self.assertIn('e', o1.__dict__)

    def test_lazy_fkey(self):
        o1, o2 = LazyFKey.objects.all()
        self.assertTrue(o1.attribute_is_unevaluated_lazy_property('f_id'))
        self.assertTrue(o2.attribute_is_unevaluated_lazy_property('f_id'))
        self.assertIsNone(o1.f)
        self.assertIsInstance(o2.f, LazyPropertyTest.TestModel)
        self.assertEqual(o2.f.a, 2)


class LazyFKey(NodbModel):
    f = models.ForeignKey(LazyPropertyTest.TestModel, blank=True, null=True)

    @bulk_attribute_setter(['f_id'])
    def set_f_id(self, objects, field_names):
        self.f_id = 2 if self.id == 2 else None

    @staticmethod
    def get_all_objects(context, query):
        return [
            LazyFKey(id=1),
            LazyFKey(id=2)
        ]


class NodbModelTest(TestCase):

    class SimpleModel(NodbModel):
        a = models.IntegerField(primary_key=True)
        b = models.IntegerField()
        with_default = models.IntegerField(default=42)

        @staticmethod
        def get_all_objects(context, query):
            return [
                NodbModelTest.SimpleModel(a=1, b=2),
                NodbModelTest.SimpleModel(a=10, b=20)
            ]

    def test_make_model_args(self):
        args = NodbModelTest.SimpleModel.make_model_args(dict(a=1, bad=3))
        self.assertEqual(args, dict(a=1))
        args = NodbModelTest.SimpleModel.make_model_args(dict(a=1, bad=3), fields_force_none=['b'])
        self.assertEqual(args, dict(a=1, b=None))

    def test_get_modified_fields(self):
        first, second = NodbModelTest.SimpleModel.objects.all()
        m = NodbModelTest.SimpleModel.objects.all()[0]
        self.assertEqual(m.get_modified_fields(), ({}, first))
        m.b = 4
        self.assertEqual(m.get_modified_fields(), ({'b': 4}, first))
        self.assertEqual(m.get_modified_fields(update_fields=['a']), ({}, first))
        self.assertEqual(m.get_modified_fields(update_fields=['b']), ({'b': 4}, first))

        self.assertEqual(m.get_modified_fields(a=second.a), ({'a': 1, 'b': 4}, second))
        self.assertEqual(m.get_modified_fields(a=second.a, update_fields=['a']), ({'a': 1}, second))

    def test_default(self):
        first, second = NodbModelTest.SimpleModel.objects.all()
        self.assertEqual(first.with_default, 42)
        self.assertEqual(second.with_default, 42)
