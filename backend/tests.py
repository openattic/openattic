"""
 *   Copyright (c) 2017 SUSE LLC
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import doctest
import os

from django.utils.unittest import TestCase
from mock import mock
from os.path import dirname, abspath, exists
from rest_client import RestClient

import module_status
import utilities
import exception
import settings


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(utilities))
    tests.addTests(doctest.DocTestSuite(module_status))
    return tests


class RunInExternalProcessTestCase(TestCase):
    def test_simple(self):
        def return1():
            return 1

        self.assertEqual(utilities.run_in_external_process(return1, 'test simple', timeout=1), 1)

    def test_huge(self):
        def return_big():
            return 'x' * (1024 * 1024)

        self.assertEqual(utilities.run_in_external_process(return_big, 'test huge', timeout=1),
                         return_big())

    def test_exception(self):
        def raise_exception():
            raise KeyError()

        self.assertRaises(KeyError,
                          lambda: utilities.run_in_external_process(raise_exception,
                                                                    'test exception', timeout=1))

    def test_exit(self):
        def just_exit():
            # NOTE: sys.exit(0) used to work here. No idea why it did work, because ...
            import os
            os._exit(0)

        # ... multiprocessing seems to have a bug where we end up in a timeout, if the child
        # died prematurely.
        self.assertRaises(exception.ExternalCommandError,
                          lambda: utilities.run_in_external_process(just_exit, 'test exit',
                                                                    timeout=1))

    def test_timeout(self):
        def just_wait():
            import time
            time.sleep(3)

        self.assertRaises(exception.ExternalCommandError,
                          lambda: utilities.run_in_external_process(just_wait, 'test timeout',
                                                                    timeout=1))


class SettingsTest(TestCase):
    secret_file_path = file_path = dirname(abspath(__file__)) + '/.secret.txt'

    def test_new_secret(self):
        utilities.write_single_setting('DJANGO_SECRET', '')
        if exists(SettingsTest.secret_file_path):
            os.remove(SettingsTest.secret_file_path)

        secret_1, should_write_1 = settings.read_secret_from_config()
        self.assertTrue(should_write_1)
        settings.write_secret_to_config(secret_1)

        secret_2, should_write_2  = settings.read_secret_from_config()
        self.assertEqual(secret_1, secret_2)
        self.assertFalse(should_write_2)

        self.assertEqual(utilities.read_single_setting('DJANGO_SECRET'), secret_2)

    def test_secret_migration_read(self):

        with open(SettingsTest.secret_file_path, 'w') as f:
            f.write('mysecret')

        utilities.write_single_setting('DJANGO_SECRET', '')

        secret, should_write_secret = settings.read_secret_from_config()
        self.assertTrue(should_write_secret)
        self.assertEqual(secret, 'mysecret')

        settings.write_secret_to_config('mysecret')
        self.assertEqual(utilities.read_single_setting('DJANGO_SECRET'), 'mysecret')
        self.assertFalse(exists(SettingsTest.secret_file_path))


class ModuleStatusTest(TestCase):

    @mock.patch('deepsea.DeepSea.get_deepsea_version')
    def test_check_deepsea_version_updated(self, get_deepsea_version_mock):
        get_deepsea_version_mock.return_value = {
            "version": settings.DEEPSEA_MIN_VERSION_ISCSI
        }
        try:
            module_status.check_deepsea_version(settings.DEEPSEA_MIN_VERSION_ISCSI)
        except:
            self.fail("Encountered an unexpected exception.")

    @mock.patch('deepsea.DeepSea.get_deepsea_version')
    def test_check_deepsea_version_not_updated(self, get_deepsea_version_mock):
        get_deepsea_version_mock.return_value = {
            "version": "0.7.0"
        }
        with self.assertRaises(module_status.UnavailableModule):
            module_status.check_deepsea_version(settings.DEEPSEA_MIN_VERSION_ISCSI)


class RestClientTest(TestCase):

    def test_timeout_auto_set(self):
        with mock.patch('requests.Session.request') as mock_request:
            rest_client = RestClient('localhost', 8000)
            rest_client.session.request('GET', '/test')
            mock_request.assert_called_with('GET', '/test', timeout=45)

    def test_timeout_auto_set_arg(self):
        with mock.patch('requests.Session.request') as mock_request:
            rest_client = RestClient('localhost', 8000)
            rest_client.session.request(
                'GET', '/test', None, None, None, None,
                None, None, None)
            mock_request.assert_called_with(
                'GET', '/test', None, None, None, None,
                None, None, None, timeout=45)

    def test_timeout_no_auto_set_kwarg(self):
        with mock.patch('requests.Session.request') as mock_request:
            rest_client = RestClient('localhost', 8000)
            rest_client.session.request('GET', '/test', timeout=20)
            mock_request.assert_called_with('GET', '/test', timeout=20)

    def test_timeout_no_auto_set_arg(self):
        with mock.patch('requests.Session.request') as mock_request:
            rest_client = RestClient('localhost', 8000)
            rest_client.session.request(
                'GET', '/test', None, None, None, None,
                None, None, 40)
            mock_request.assert_called_with(
                'GET', '/test', None, None, None, None,
                None, None, 40)
