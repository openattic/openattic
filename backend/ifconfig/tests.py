from django.test import TestCase

from ifconfig.models import Host


class HostTest(TestCase):
    def test_not_localhost(self):
        self.assertNotEqual(Host.objects.get_current(), 'localhost')

    def test_is_oa_host(self):
        self.assertTrue(Host.objects.get_current().is_oa_host)
