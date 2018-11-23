from django.test import TestCase
from oa_settings import _set_setting, Settings


class OaSettingsTestCase(TestCase):

    def test_set_setting_bool(self):
        _set_setting("RGW_API_SSL_VERIFY", True)
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertTrue(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "True")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertTrue(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "yes")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertTrue(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "1")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertTrue(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", 1)
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertTrue(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "False")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertFalse(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", False)
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertFalse(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "no")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertFalse(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", "0")
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertFalse(Settings.RGW_API_SSL_VERIFY)
        _set_setting("RGW_API_SSL_VERIFY", 0)
        self.assertIsInstance(Settings.RGW_API_SSL_VERIFY, bool)
        self.assertFalse(Settings.RGW_API_SSL_VERIFY)

    def test_set_setting_int(self):
        _set_setting("SALT_API_PORT", "1234")
        self.assertIsInstance(Settings.SALT_API_PORT, int)
        self.assertEqual(Settings.SALT_API_PORT, 1234)

    def test_set_setting_str(self):
        _set_setting("SALT_API_HOST", "foo.bar")
        self.assertIsInstance(Settings.SALT_API_HOST, str)
        self.assertEqual(Settings.SALT_API_HOST, "foo.bar")
