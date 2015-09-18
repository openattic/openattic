
from unittest import SkipTest

from testcase import GatlingTestCase

class LvTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(LvTestScenario, cls).setUpClass()

        cls.require_config("options", "connect")
        cls.require_config("options", "auth_token")

        if cls.__name__.startswith("Remote"):
            cls.require_enabled("lvm:remote")
            cls.require_config("lvm:remote", "vg")
            lvm_conf_part = "lvm:remote"
        else:
            cls.require_enabled("lvm")
            cls.require_config("lvm", "vg")
            lvm_conf_part = "lvm"

        vg_name = cls.conf.get(lvm_conf_part, "vg")

        res = cls.send_request("GET", "pools", search_param=("name=%s" % vg_name))

        if res["count"] != 1:
            raise SkipTest("REST api returned no or more than one object(s). But only one is expected.")
        cls.vg = res["response"][0]

        if cls.vg["name"] != cls.conf.get(lvm_conf_part, "vg") or \
                        cls.vg["type"]["app_label"] != "lvm" or \
                        cls.vg["type"]["model"] != "volumegroup":
            print "VG not found"
            print cls.vg["name"]
            raise SkipTest("VG not found")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    def _get_pool(self):
        return self.vg


class RemoteLvTestScenario(LvTestScenario):
    pass
