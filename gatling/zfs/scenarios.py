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

from unittest import SkipTest

from testcase import GatlingTestCase
from lvm.scenarios import LvTestScenario

class ZfsNativePoolTestScenario(GatlingTestCase):
    """ Runs ZFS tests against a native ZPool that already exists on the target system. """
    @classmethod
    def setUpClass(cls):
        super(ZfsNativePoolTestScenario, cls).setUpClass()

        cls.require_enabled("zfs")
        cls.require_config("zfs", "zpool")
        pool_name = cls.conf.get("zfs", "zpool")

        res = cls.send_request("GET", "pools", search_param=("name=%s" % pool_name))
        if res["count"] != 1:
            raise SkipTest("REST api returned no or more than one object(s). But expected only one.")
        cls.zpool = res["response"][0]

        if cls.zpool["name"] != cls.conf.get("zfs", "zpool") or \
            cls.zpool["type"]["app_label"] != "zfs" or \
            cls.zpool["type"]["model"] != "zpool":
            print "Zpool not found"
            print cls.zpool["name"]
            raise SkipTest("Zpool not found")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    def _get_pool(self):
        return self.zpool


class ZfsLvmPoolTestScenario(LvTestScenario):

    bigsize     = 800
    smallsize   = 500

    @classmethod
    def setUpClass(cls):
        super(ZfsLvmPoolTestScenario, cls).setUpClass()
        cls.require_enabled("zfs:lvm")

        data = {
            "megs": 2000,
            "name": "gatling_zpool",
            "source_pool": {"id": cls.vg["id"]},
            "filesystem": "zfs",
        }
        res = cls.send_request("POST", "volumes", data=data)
        time.sleep(6)
        if res["count"] != 1:
            raise SkipTest("REST api returned no or more than one object(s). But expected only one.")
        cls.zpool = res["response"]

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    @classmethod
    def tearDownClass(cls):
        super(ZfsLvmPoolTestScenario, cls).tearDownClass()
        cls.send_request("DELETE", "volumes", obj_id=cls.zpool["id"])

    def _get_pool(self):
        zpool = self.send_request("GET", "volumes", obj_id=self.zpool["id"])
        return zpool["response"]
