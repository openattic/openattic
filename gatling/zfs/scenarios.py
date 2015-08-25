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

    def _get_pool(self):
        return self.zpool


class ZfsLvmPoolTestScenario(LvTestScenario):
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
    def tearDownClass(cls):
        super(ZfsLvmPoolTestScenario, cls).tearDownClass()
        cls.send_request("DELETE", "volumes", obj_id=cls.zpool["id"])

    def _get_pool(self):
        zpool = self.send_request("GET", "volumes", obj_id=self.zpool["id"])
        return zpool["response"]
