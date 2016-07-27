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
            self.assertEqual(mock_get_dbus_object().e4fs_format.call_args[0], ("/dev/testpath", "yaaayname", 256*1024, 4))

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0], ("ext4", "/dev/testpath", "/media/yaaayname", []))

            self.assertTrue( mock_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0], ("/media/yaaayname", "mziegler", "users"))

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
            self.assertEqual(mock_get_dbus_object().fs_unmount.call_args[0], ("/dev/testpath", "/media/yaaayname"))

            self.assertTrue( mock_get_dbus_object().e2fs_check.called)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_args[0], ("/dev/testpath",))

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0], ("/dev/testpath", 10000, False))

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0], ("ext2", "/dev/testpath", "/media/yaaayname", []))

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
            self.assertEqual(mock_get_dbus_object().e2fs_check.call_args[0], ("/dev/testpath",))

            self.assertTrue( mock_get_dbus_object().e2fs_resize.called)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0], ("/dev/testpath", 10000, False))

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
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0], ("/dev/testpath", 100000, True))

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
            self.assertEqual(mock_get_dbus_object().e2fs_resize.call_args[0], ("/dev/testpath", 100000, True))

            self.assertFalse(mock_get_dbus_object().fs_mount.called)

    def test_e2fs_set_uuid_value(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("ext2")(volume)
            fs.set_uuid("1111-2222-3333-4444")

            self.assertTrue( mock_get_dbus_object().e2fs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0], ("/dev/testpath", "1111-2222-3333-4444"))

    def test_e2fs_set_uuid_generate(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("ext2")(volume)
            fs.set_uuid(generate=True)

            self.assertTrue( mock_get_dbus_object().e2fs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().e2fs_set_uuid.call_args[0], ("/dev/testpath", "random"))

    def test_e3fs_check_type(self):
        from volumes.filesystems.extfs import Ext3
        self.assertTrue( Ext3.check_type("""/dev/vgfaithdata/linux: sticky Linux rev 1.0 ext3 filesystem data, UUID=40275826-df77-49e3-9686-2f46dd8e2052, volume name "linux" (needs journal recovery) (large files)""") )

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
            self.assertEqual(mock_get_dbus_object().xfs_format.call_args[0], ("/dev/testpath", 256*1024, 4, 16))

            self.assertTrue( mock_get_dbus_object().write_fstab.called)
            self.assertEqual(mock_get_dbus_object().write_fstab.call_count, 1)

            self.assertTrue( mock_get_dbus_object().fs_mount.called)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_mount.call_args[0], ("xfs", "/dev/testpath", "/media/yaaayname", []))

            self.assertTrue( mock_get_dbus_object().fs_chown.called)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_count, 1)
            self.assertEqual(mock_get_dbus_object().fs_chown.call_args[0], ("/media/yaaayname", "mziegler", "users"))

    def test_xfs_shrink(self):
        with self.assertRaises(NotImplementedError):
            fs = get_by_name("xfs")(None)
            fs.shrink(100000, 10000)

    def test_xfs_grow(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.name = "yaaayname"
            volume.storageobj.snapshot = None

            fs = get_by_name("xfs")(volume)
            fs.grow(10000, 100000)

            self.assertFalse(mock_get_dbus_object().fs_unmount.called)

            self.assertTrue( mock_get_dbus_object().xfs_resize.called)
            self.assertEqual(mock_get_dbus_object().xfs_resize.call_count, 1)
            self.assertEqual(mock_get_dbus_object().xfs_resize.call_args[0], ("/media/yaaayname", 100000))

            self.assertFalse(mock_get_dbus_object().fs_mount.called)

    def test_xfs_set_uuid_value(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("xfs")(volume)
            fs.set_uuid("1111-2222-3333-4444")

            self.assertTrue( mock_get_dbus_object().xfs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().xfs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().xfs_set_uuid.call_args[0], ("/dev/testpath", "1111-2222-3333-4444"))

    def test_xfs_set_uuid_generate(self):
        with mock.patch("volumes.filesystems.filesystem.get_dbus_object") as mock_get_dbus_object:
            volume = mock.MagicMock()
            volume.storageobj.blockvolume.volume.path = "/dev/testpath"

            fs = get_by_name("xfs")(volume)
            fs.set_uuid(generate=True)

            self.assertTrue( mock_get_dbus_object().xfs_set_uuid.called)
            self.assertEqual(mock_get_dbus_object().xfs_set_uuid.call_count, 1)
            self.assertEqual(mock_get_dbus_object().xfs_set_uuid.call_args[0], ("/dev/testpath", "generate"))

    def test_xfs_check_type(self):
        from volumes.filesystems.xfs import Xfs
        self.assertTrue( Xfs.check_type("""/dev/vgfaithdata/ceph03: sticky SGI XFS filesystem data (blksz 4096, inosz 256, v2 dirs)""") )

