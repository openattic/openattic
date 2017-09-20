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


from django.test import TestCase

from ifconfig.models import Host


class HostTest(TestCase):
    def test_not_localhost(self):
        self.assertNotEqual(Host.objects.get_current(), 'localhost')

    def test_is_oa_host(self):
        self.assertTrue(Host.objects.get_current().is_oa_host)
