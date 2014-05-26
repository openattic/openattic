# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import os
import os.path
import mock

from time import time

from django.test import TestCase

from systemd.lockutils import acquire_lock, release_lock, AlreadyLocked, Lockfile

class LockutilsTestCase(TestCase):

    def test_acquire_nonexistant_lock(self):
        if os.path.exists("/tmp/testlock"):
            os.unlink("/tmp/testlock")

        self.assertFalse(os.path.exists("/tmp/testlock"))

        lock = acquire_lock("/tmp/testlock")
        self.assertTrue(os.path.exists("/tmp/testlock"))
        self.assertTrue(isinstance(lock, tuple))

        release_lock(lock)
        self.assertFalse(os.path.exists("/tmp/testlock"))

    def test_acquire_existing_lock(self):
        if not os.path.exists("/tmp/testlock"):
            # create an empty testlock file
            open("/tmp/testlock", "a").close()

        self.assertTrue(os.path.exists("/tmp/testlock"))

        lock = acquire_lock("/tmp/testlock")
        self.assertTrue(os.path.exists("/tmp/testlock"))
        self.assertIsInstance(lock, tuple)
        release_lock(lock)
        self.assertFalse(os.path.exists("/tmp/testlock"))

    def test_acquire_lock_fails_when_acquired(self):
        lock = acquire_lock("/tmp/testlock")

        start = time()
        with mock.patch("systemd.lockutils.logging") as mock_logging:
            with self.assertRaises(AlreadyLocked):
                acquire_lock("/tmp/testlock", 2)
            self.assertTrue(mock_logging.error.called)

        self.assertTrue( time() - start >= 2 )
        self.assertTrue( time() - start < 3.1 )

        release_lock(lock)
        self.assertFalse(os.path.exists("/tmp/testlock"))

    def test_lockfile_noexception(self):
        with mock.patch("systemd.lockutils.acquire_lock") as mock_acquire_lock, \
             mock.patch("systemd.lockutils.release_lock") as mock_release_lock:
            with Lockfile("/tmp/testlock"):
                pass
            self.assertTrue(mock_acquire_lock.called)
            self.assertTrue(mock_release_lock.called)

    def test_lockfile_exception(self):
        with mock.patch("systemd.lockutils.acquire_lock") as mock_acquire_lock, \
             mock.patch("systemd.lockutils.release_lock") as mock_release_lock:
            with self.assertRaises(Exception):
                with Lockfile("/tmp/testlock"):
                    raise Exception()
            self.assertTrue(mock_acquire_lock.called)
            self.assertTrue(mock_release_lock.called)
