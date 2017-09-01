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

from django.utils.unittest import TestCase

import utilities
import exception


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(utilities))
    return tests


class RunInExternalProcessTestCase(TestCase):
    def test_simple(self):
        def return1():
            return 1

        self.assertEqual(utilities.run_in_external_process(return1, timeout=1), 1)

    def test_huge(self):
        def return_big():
            return 'x' * (1024 * 1024)

        self.assertEqual(utilities.run_in_external_process(return_big, timeout=1), return_big())

    def test_exception(self):
        def raise_exception():
            raise KeyError()

        self.assertRaises(KeyError,
                          lambda: utilities.run_in_external_process(raise_exception, timeout=1))

    def test_exit(self):
        def just_exit():
            # NOTE: sys.exit(0) used to work here. No idea why it did work, because ...
            import os
            os._exit(0)

        # ... multiprocessing seems to have a bug where we end up in a timeout, if the child
        # died prematurely.
        self.assertRaises(exception.ExternalCommandError,
                          lambda: utilities.run_in_external_process(just_exit, timeout=1))


    def test_timeout(self):
        def just_wait():
            import time
            time.sleep(3)

        self.assertRaises(exception.ExternalCommandError,
                          lambda: utilities.run_in_external_process(just_wait, timeout=1))
