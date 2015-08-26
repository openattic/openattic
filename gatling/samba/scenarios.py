
from testcase import GatlingTestCase

class SambaTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(SambaTestScenario, cls).setUpClass()
        cls.require_enabled("samba")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()
