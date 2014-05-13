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
import dbus

from django.test import TestCase

from volumes.filesystems import get_by_name
from zfs.filesystems import scale_to_megs, Zfs

class ZfsFileSystemTestCase(TestCase):
    def test_scale_to_megs(self):
        self.assertEqual(scale_to_megs("3.62T"),   3795845.12)
        self.assertEqual(scale_to_megs("672.42G"),  688558.08)
        self.assertEqual(scale_to_megs("-"),             None)
        self.assertEqual(scale_to_megs("1073741824"),    1024)
        with self.assertRaises(ValueError):
            scale_to_megs("5.37Z")

    def test_get_by_name(self):
        self.assertEqual(get_by_name("zfs"), Zfs)

    def test_path_zpool(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky"
        volume.storageobj.snapshot = None

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky")

    def test_path_volume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk"
        volume.storageobj.snapshot = None

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/tonk")

    def test_path_subvolume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk/badonk"
        volume.storageobj.snapshot = None

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/tonk/badonk")

    def test_path_subsubvolume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk/badonk/adonk"
        volume.storageobj.snapshot = None

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/tonk/badonk/adonk")

    def test_snappath_zpool(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky"
        volume.storageobj.snapshot = "not None"

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/.snapshots")

    def test_snappath_volume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk"
        volume.storageobj.snapshot = "not None"

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/.snapshots/tonk")

    def test_snappath_subvolume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk/badonk"
        volume.storageobj.snapshot = "not None"

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/.snapshots/tonk/badonk")

    def test_snappath_subsubvolume(self):
        zpool = mock.MagicMock()
        zpool.storageobj.name = "honky"

        volume = mock.MagicMock()
        volume.fullname = "honky/tonk/badonk/adonk"
        volume.storageobj.snapshot = "not None"

        fs = Zfs(zpool, volume)
        self.assertEqual(fs.path, "/media/honky/.snapshots/tonk/badonk/adonk")

    def test_allocated_megs(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            mock_get_dbus_object("/zfs").zpool_get.return_value = dbus.Array([
                dbus.Array([
                    dbus.String("tank"),
                    dbus.String("allocated"),
                    dbus.String("3.62T"),
                    dbus.String("-")
                ])
            ])

            zpool = mock.MagicMock()
            zpool.storageobj.name = "honky"

            fs = Zfs(zpool, None)
            self.assertEqual(fs.allocated_megs, 3795845.12)

            self.assertTrue( mock_get_dbus_object("/zfs").zpool_get.called)
            self.assertEqual(mock_get_dbus_object("/zfs").zpool_get.call_count, 1)
            self.assertEqual(mock_get_dbus_object("/zfs").zpool_get.call_args[0][0], "honky")
            self.assertEqual(mock_get_dbus_object("/zfs").zpool_get.call_args[0][1], "allocated")

