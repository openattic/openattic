
from django.test import TestCase

from .distro import distro_settings

import tempfile

class ClasslessTestCase(TestCase):

    def test_distro_settings_returns_settings(self):
        with tempfile.NamedTemporaryFile(suffix=".tmp") as tmpfile:
            tmpfile.write("KEY=\"value\"")
            tmpfile.flush()
            _settings = distro_settings([ tmpfile.name ])
            assert _settings['KEY'] == 'value'

    def test_distro_settings_for_django(self):
        with tempfile.NamedTemporaryFile(suffix=".tmp") as tmpfile:
            tmpfile.write("KEY=\"value\"")
            tmpfile.flush()
            from django.conf import settings
            distro_settings([ tmpfile.name ])
            assert getattr(settings, "KEY") == 'value'

    def test_distro_settings_ignores_comments(self):
        with tempfile.NamedTemporaryFile(suffix=".tmp") as tmpfile:
            tmpfile.write("# A comment")
            tmpfile.flush()
            _settings = distro_settings([ tmpfile.name ])
            assert _settings == {}
