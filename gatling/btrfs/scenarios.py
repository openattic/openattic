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

import time
from lvm.scenarios import LvTestScenario


class BtrfsLvmPoolTestScenario(LvTestScenario):
    api_prefix = "volumes"

    @classmethod
    def setUpClass(cls):
        super(BtrfsLvmPoolTestScenario, cls).setUpClass()
        cls.require_config("btrfs:lvm")

        data = {"filesystem": "btrfs",
                "megs": 8000,
                "name": "gatling_btrfs",
                "source_pool": {"id": cls.vg["id"]}}
        res = cls.send_request("POST", data=data)
        time.sleep(8)
        cls.btrfs = res["response"]

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    @classmethod
    def tearDownClass(cls):
        super(BtrfsLvmPoolTestScenario, cls).tearDownClass()
        cls.send_request("DELETE", obj_id=cls.btrfs["id"])

    def _get_pool(self):
        return self.btrfs
