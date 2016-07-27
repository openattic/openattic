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

from testcase import GatlingTestCase


class HttpTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(HttpTestScenario, cls).setUpClass()
        cls.require_enabled("http")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()
