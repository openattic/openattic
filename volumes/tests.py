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

from volumes.filesystems import FileSystem, get_by_name

class FileSystemTestCase(TestCase):

    def test_write_fstab(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            fs = FileSystem(None)
            fs.write_fstab()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/volumes")

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

    def test_e4fs_format(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"
            volume.storageobj.blockvolume.volume.raid_params = {"chunksize": 256*1024, "datadisks": 4}
            volume.owner.username = "mziegler"

            fs = get_by_name("ext4")(volume)
            fs.format()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/volumes")

            self.assertTrue( mock_get_dbus_object().e4fs_format.called)
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_args[0][1], "yaaayname")
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_args[0][2], 256*1024)
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_args[0][3], 4)

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][0], "ext4")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][1], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][2], "/media/yaaayname")

            self.assertTrue( mock_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][0], "/media/yaaayname")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][1], "mziegler")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][2], "users")

    def test_e2fs_shrink_online(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("os.path.ismount") as mock_os_path_ismount:

            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            mock_os_path_ismount.return_value = True

            fs = get_by_name("ext2")(volume)
            fs.shrink(100000, 10000)

            self.assertTrue( mock_get_dbus_object().fs_unmount.called)
            self.assertEqual(mock_get_dbus_object().fs_unmount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_unmount.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().fs_unmount.call_args[0][1], "/media/yaaayname")

            self.assertTrue( mock_get_dbus_object().e2fs_check.called)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_args[0][0], "/dev/testpath")

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][1], 10000)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][2], False)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][0], "ext2")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][1], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][2], "/media/yaaayname")

    def test_e2fs_shrink_offline(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("os.path.ismount") as mock_os_path_ismount:

            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            mock_os_path_ismount.return_value = False

            fs = get_by_name("ext2")(volume)
            fs.shrink(100000, 10000)

            self.assertFalse(mock_get_dbus_object().fs_unmount.called)

            self.assertTrue( mock_get_dbus_object().e2fs_check.called)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_args[0][0], "/dev/testpath")

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][1], 10000)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][2], False)

            self.assertFalse( mock_get_dbus_object().fs_mount.called)

    def test_e2fs_grow_online(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("os.path.ismount") as mock_os_path_ismount:

            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            mock_os_path_ismount.return_value = True

            fs = get_by_name("ext2")(volume)
            fs.grow(10000, 100000)

            self.assertFalse(mock_get_dbus_object().fs_unmount.called)

            self.assertFalse(mock_get_dbus_object().e2fs_check.called)

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][1], 100000)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][2], True)

            self.assertFalse(mock_get_dbus_object().fs_mount.called)

    def test_e2fs_grow_offline(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object, \
             mock.patch("os.path.ismount") as mock_os_path_ismount:

            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"
            volume.storageobj.blockvolume.volume.raid_params = {"chunksize": 256*1024, "datadisks": 4}
            volume.owner.username = "mziegler"

            mock_os_path_ismount.return_value = False

            fs = get_by_name("ext2")(volume)
            fs.grow(10000, 100000)

            self.assertFalse(mock_get_dbus_object().fs_unmount.called)

            self.assertFalse(mock_get_dbus_object().e2fs_check.called)

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][1], 100000)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0][2], True)

            self.assertFalse(mock_get_dbus_object().fs_mount.called)

    def test_e2fs_set_uuid_value(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("ext2")(volume)
            fs.set_uuid("1111-2222-3333-4444")

            self.assertTrue( mock_get_dbus_object().e2fs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0][1], "1111-2222-3333-4444")

    def test_e2fs_set_uuid_generate(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("ext2")(volume)
            fs.set_uuid(generate=True)

            self.assertTrue( mock_get_dbus_object().e2fs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0][1], "random")

    def test_xfs_format(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.megs = 100000
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"
            volume.storageobj.blockvolume.volume.raid_params = {"chunksize": 256*1024, "datadisks": 4}
            volume.owner.username = "mziegler"

            fs = get_by_name("xfs")(volume)
            fs.format()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/volumes")

            self.assertTrue( mock_get_dbus_object().xfs_format.called)
            self.assertEqual(mock_get_dbus_object().xfs_format.call_count, 1)
            self.assertEqual(mock_get_dbus_object().xfs_format.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().xfs_format.call_args[0][1], 256*1024)
            self.assertEqual(mock_get_dbus_object().xfs_format.call_args[0][2], 4)
            self.assertEqual(mock_get_dbus_object().xfs_format.call_args[0][3], 16)

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][0], "xfs")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][1], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][2], "/media/yaaayname")

            self.assertTrue( mock_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][0], "/media/yaaayname")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][1], "mziegler")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][2], "users")

    def test_ocfs2_format(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.megs = 100000
            volume.storageobj.snapshot = None
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"
            volume.storageobj.blockvolume.volume.raid_params = {"chunksize": 256*1024, "datadisks": 4}
            volume.owner.username = "mziegler"

            fs = get_by_name("ocfs2")(volume)
            fs.format()

            self.assertTrue( mock_get_dbus_object.called)
            self.assertEqual(mock_get_dbus_object.call_args[0][0], "/volumes")

            self.assertTrue( mock_get_dbus_object().ocfs2_format.called)
            self.assertEqual(mock_get_dbus_object().ocfs2_format.call_count, 1)
            self.assertEqual(mock_get_dbus_object().ocfs2_format.call_args[0][0], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().ocfs2_format.call_args[0][1], 256*1024)

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][0], "ocfs2")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][1], "/dev/testpath")
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0][2], "/media/yaaayname")

            self.assertTrue( mock_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][0], "/media/yaaayname")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][1], "mziegler")
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0][2], "users")

