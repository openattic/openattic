# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import mock
import tempfile

from django.test import TestCase

from ceph.models import Cluster

from ceph.librados import Keyring

class ClusterTestCase(TestCase):
    def test_get_recommended_pg_num(self):
        with mock.patch("ceph.models.Cluster.osd_set") as mock_osd_set:
            c = Cluster()
            # small setups
            mock_osd_set.count.return_value = 2
            self.assertEqual(c.get_recommended_pg_num(3), 128)
            mock_osd_set.count.return_value = 3
            self.assertEqual(c.get_recommended_pg_num(3), 128)

            # the example from the Ceph docs
            mock_osd_set.count.return_value = 200
            self.assertEqual(c.get_recommended_pg_num(3), 8192)

            # make sure the rounding step doesn't round up a power of two to
            # the next power of two above it, but keeps it unaltered
            mock_osd_set.count.return_value = 8192
            self.assertEqual(c.get_recommended_pg_num(100), 8192)


class KeyringTestCase(TestCase):
    def test_keyring_succeeds(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") as tmpfile:
            tmpfile.write("[client.admin]")
            tmpfile.flush()
            keyring = Keyring('ceph', '/tmp')
            self.assertEqual(keyring.username, 'client.admin')

    def test_keyring_raises_runtime_error(self):
        try:
            keyring = Keyring('ceph', '/tmp')
        except RuntimeError, e:
            return True

    def test_username_raises_runtime_error(self):
        with tempfile.NamedTemporaryFile(dir='/tmp', prefix='ceph.client.', suffix=".keyring") as tmpfile:
            tmpfile.write("abcdef")
            tmpfile.flush()
            try:
                keyring = Keyring('ceph', '/tmp')
            except RuntimeError, e:
                return True
