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

from dbus.service import InterfaceType
from django.utils.unittest import TestCase

from systemd import plugins
from systemd import helpers  # test imports
from systemd.management.commands.runsystemd import get_SystemD_classes
from systemd.plugins import BasePlugin


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(plugins))
    return tests


class SystemDTestCase(TestCase):
    def test_get_SystemD_classes(self):
        modules = get_SystemD_classes()
        self.assertEqual(set(modules.keys()), {'oa_settings.systemapi', 'ceph_nfs.systemapi'})
        for val in modules.values():
            self.assertIsInstance(val, InterfaceType)
