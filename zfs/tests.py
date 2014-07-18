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
            self.assertEqual(mock_get_dbus_object("/zfs").zpool_get.call_args[0], ("honky", "allocated"))

    def test_format(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_volumes_get_dbus_object:

            zpool = mock.MagicMock()
            zpool.storageobj.name = "honky"
            zpool.storageobj.blockvolume.volume.path = "/dev/testpath"

            volume = mock.MagicMock()
            volume.fullname = "honky"
            volume.storageobj.snapshot = None
            volume.owner.username = "mziegler"

            fs = Zfs(zpool, volume)
            fs.format()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/zfs")

            self.assertTrue( mock_get_dbus_object().zpool_format.called)
            self.assertEqual(mock_get_dbus_object().zpool_format.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zpool_format.call_args[0], ("/dev/testpath", "honky", "/media/honky"))

            self.assertFalse(mock_volumes_get_dbus_object().write_fstab.called)
            self.assertFalse(mock_volumes_get_dbus_object().fs_mount.called)

            self.assertTrue( mock_volumes_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_volumes_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_volumes_get_dbus_object().fs_chown.call_args[0], ("/media/honky", "mziegler", "users"))

    def test_destroy(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            zpool = mock.MagicMock()
            zpool.storageobj.name = "honky"

            fs = Zfs(zpool, None)
            fs.destroy()

            self.assertTrue( mock_get_dbus_object().zpool_destroy.called)
            self.assertEqual(mock_get_dbus_object().zpool_destroy.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zpool_destroy.call_args[0], ("honky",))

    def test_mount(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_volumes_get_dbus_object:

            volume = mock.MagicMock()
            volume.fullname = "honky"

            fs = Zfs(volume, volume)
            fs.mount()

            self.assertTrue( mock_get_dbus_object().zfs_mount.called)
            self.assertEqual(mock_get_dbus_object().zfs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_mount.call_args[0], ("honky",))

            self.assertFalse(mock_volumes_get_dbus_object().fs_mount.called)

    def test_unmount(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_volumes_get_dbus_object:

            volume = mock.MagicMock()
            volume.fullname = "honky"

            fs = Zfs(volume, volume)
            fs.unmount()

            self.assertTrue( mock_get_dbus_object().zfs_unmount.called)
            self.assertEqual(mock_get_dbus_object().zfs_unmount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_unmount.call_args[0], ("honky",))

            self.assertFalse(mock_volumes_get_dbus_object().fs_unmount.called)

    def test_create_subvolume_eqsize(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.fullname = "honky/tonk"
            volume.storageobj.megs = 10000
            zpool = mock.MagicMock()
            zpool.storageobj.megs  = 10000

            fs = Zfs(zpool, volume)
            fs.create_subvolume()

            self.assertFalse(mock_get_dbus_object().zvol_create_volume.called)
            self.assertTrue( mock_get_dbus_object().zfs_create_volume.called)
            self.assertEqual(mock_get_dbus_object().zfs_create_volume.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_create_volume.call_args[0], ("honky/tonk", 0))

    def test_create_subvolume_smallersize(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.fullname = "honky/tonk"
            volume.storageobj.megs = 1000
            zpool = mock.MagicMock()
            zpool.storageobj.megs  = 10000

            fs = Zfs(zpool, volume)
            fs.create_subvolume()

            self.assertFalse(mock_get_dbus_object().zvol_create_volume.called)
            self.assertTrue( mock_get_dbus_object().zfs_create_volume.called)
            self.assertEqual(mock_get_dbus_object().zfs_create_volume.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_create_volume.call_args[0], ("honky/tonk", 1000))

    def test_create_zvol(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.fullname = "honky/tonk"
            volume.storageobj.megs = 10000

            fs = Zfs(None, volume)
            fs.create_zvol()

            self.assertFalse(mock_get_dbus_object().zfs_create_volume.called)
            self.assertTrue( mock_get_dbus_object().zvol_create_volume.called)
            self.assertEqual(mock_get_dbus_object().zvol_create_volume.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zvol_create_volume.call_args[0], ("honky/tonk", 10000))

    def test_destroy_subvolume(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.fullname = "honky/tonk"

            fs = Zfs(None, volume)
            fs.destroy_subvolume()

            self.assertTrue( mock_get_dbus_object().zfs_destroy_volume.called)
            self.assertEqual(mock_get_dbus_object().zfs_destroy_volume.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_destroy_volume.call_args[0], ("honky/tonk",))

    def test_create_snapshot(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            zpool = mock.MagicMock()
            zpool.storageobj.name = "honky"

            origvolume = mock.MagicMock()
            origvolume.storageobj.name = "tonk"
            origvolume.fullname = "honky/tonk"

            volume = mock.MagicMock()
            volume.storageobj.name = "tonk_2014-05-13-17-12-43"
            volume.fullname = "honky/tonk_2014-05-13-17-12-43"

            fs = Zfs(zpool, volume)
            fs.create_snapshot(origvolume)

            self.assertTrue( mock_get_dbus_object().zfs_create_snapshot.called)
            self.assertEqual(mock_get_dbus_object().zfs_create_snapshot.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_create_snapshot.call_args[0], ("honky/tonk@tonk_2014-05-13-17-12-43",))

            self.assertTrue( mock_get_dbus_object().zfs_clone.called)
            self.assertEqual(mock_get_dbus_object().zfs_clone.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_clone.call_args[0], ("honky/tonk@tonk_2014-05-13-17-12-43",
                                                                             "honky/.snapshots/tonk_2014-05-13-17-12-43"))

    def test_create_zvol_snapshot(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            origvolume = mock.MagicMock()
            origvolume.fullname = "honky/tonk"

            volume = mock.MagicMock()
            volume.storageobj.name = "tonk_2014-05-13-17-12-43"

            fs = Zfs(None, volume)
            fs.create_zvol_snapshot(origvolume)

            self.assertTrue( mock_get_dbus_object().zvol_create_snapshot.called)
            self.assertEqual(mock_get_dbus_object().zvol_create_snapshot.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zvol_create_snapshot.call_args[0], ("honky/tonk@tonk_2014-05-13-17-12-43",))

            self.assertFalse(mock_get_dbus_object().zfs_clone.called)

    def test_destroy_snapshot(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            origvolume = mock.MagicMock()
            origvolume.fullname = "honky/tonk"

            volume = mock.MagicMock()
            volume.storageobj.name = "tonk_2014-05-13-17-12-43"

            fs = Zfs(None, volume)
            fs.destroy_snapshot(origvolume)

            self.assertTrue( mock_get_dbus_object().zfs_destroy_snapshot.called)
            self.assertEqual(mock_get_dbus_object().zfs_destroy_snapshot.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_destroy_snapshot.call_args[0], ("honky/tonk@tonk_2014-05-13-17-12-43",))

    def test_rollback_snapshot(self):
        with mock.patch("zfs.filesystems.get_dbus_object") as mock_get_dbus_object:
            origvolume = mock.MagicMock()
            origvolume.fullname = "honky/tonk"

            volume = mock.MagicMock()
            volume.storageobj.name = "tonk_2014-05-13-17-12-43"

            fs = Zfs(None, volume)
            fs.rollback_snapshot(origvolume)

            self.assertTrue( mock_get_dbus_object().zfs_rollback_snapshot.called)
            self.assertEqual(mock_get_dbus_object().zfs_rollback_snapshot.call_count, 1)
            self.assertEqual(mock_get_dbus_object().zfs_rollback_snapshot.call_args[0], ("honky/tonk@tonk_2014-05-13-17-12-43",))

