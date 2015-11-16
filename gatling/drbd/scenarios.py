
from lvm.scenarios import RemoteLvTestScenario

class DrbdTestScenario(RemoteLvTestScenario):
    @classmethod
    def setUpClass(cls):
        super(DrbdTestScenario, cls).setUpClass()
        cls.require_enabled("drbd")
