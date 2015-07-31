
from testcase import GatlingTestCase

class HttpTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(HttpTestScenario, cls).setUpClass()
        cls.require_enabled("http")
