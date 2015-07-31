
from testcase import GatlingTestCase

class SambaTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(SambaTestScenario, cls).setUpClass()
        cls.require_enabled("samba")