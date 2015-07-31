
from unittest import SkipTest

from testcase import GatlingTestCase

class NfsTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(NfsTestScenario, cls).setUpClass()
        cls.require_enabled("nfs")
        if not cls.conf.has_section("nfs:export"):
            raise SkipTest("missing config section 'nfs:export'")