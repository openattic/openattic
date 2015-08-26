
from testcase import GatlingTestCase

class HttpTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(HttpTestScenario, cls).setUpClass()
        cls.require_enabled("http")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()
