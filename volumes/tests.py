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

import mock

from django.test import TestCase

from volumes.filesystems import FileSystem

class FileSystemTestCase(TestCase):

    def test_write_fstab(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            fs = FileSystem(None)
            fs.write_fstab()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/volumes")

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

