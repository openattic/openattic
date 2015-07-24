# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from testcase import GatlingTestCase

class TestPing(GatlingTestCase):
    def test_ping(self):
        self.assertEqual(self.api.ping(), "pong")
