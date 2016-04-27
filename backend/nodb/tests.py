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

from django.test import TestCase
from nodb.models import QuerySet
from ceph.models import CephClusterCliModel


# TODO move the test to the right place
class QuerySetTestCase(TestCase):

    def setUp(self):
        class DummyModel(object):
            @staticmethod
            def get_all_objects():
                return [
                    CephClusterCliModel(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd09', name='ceph'),
                    CephClusterCliModel(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd08', name='additional'),
                    CephClusterCliModel(fsid='b53a6c7a-6d99-4a48-a4f9-bf35945eae75', name='additional'),
                ]
        self.model = DummyModel


    def test_filter(self):

        qs = QuerySet(self.model)

        actual_result = qs.filter(name='additional')
        expected_result = [
            CephClusterCliModel(fsid='e79f3338-f9e4-4656-8af3-7af7357fcd08', name='additional'),
            CephClusterCliModel(fsid='b53a6c7a-6d99-4a48-a4f9-bf35945eae75', name='additional'),
        ]
        self.assertEqual(actual_result, expected_result)
