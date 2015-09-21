
from unittest import SkipTest

from requests.exceptions import HTTPError

from testcase import GatlingTestCase

class LvTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(LvTestScenario, cls).setUpClass()
        cls.require_config("options", "connect")
        cls.require_config("options", "auth_token")
        cls.require_enabled("lvm")
        cls.require_config("lvm", "vg")
        cls.vg = cls._get_vg_by_name(cls.conf.get("lvm", "vg"))

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    @classmethod
    def _get_vg_by_name(cls, vg_name):
        try:
            res = cls.send_request("GET", "pools", search_param=("name=%s" % vg_name))
        except HTTPError as e:
            raise SkipTest(e.message)

        if res["count"] != 1:
            raise SkipTest("REST api returned no or more than one object(s). But only one is expected.")

        vg = res["response"][0]

        if vg["name"] != vg_name or \
            vg["type"]["app_label"] != "lvm" or \
            vg["type"]["model"] != "volumegroup":
            print "VG not found"
            print vg["name"]
            raise SkipTest("VG not found")

        return vg

    def _get_pool(self):
        return self.vg


class RemoteLvTestScenario(LvTestScenario):
    @classmethod
    def setUpClass(cls):
        super(RemoteLvTestScenario, cls).setUpClass()
        cls.require_enabled("lvm:remote")
        cls.require_config("lvm:remote", "vg")
        cls.remote_vg = cls._get_vg_by_name(cls.conf.get("lvm:remote", "vg"))

    def _get_remote_pool(self):
        return self.remote_vg
