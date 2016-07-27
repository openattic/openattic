# -*- coding: utf-8 -*-
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

import dbus
import os
import os.path

from systemd import get_dbus_object, dbus_to_python
from volumes.conf import settings as volumes_settings

class FileSystemMeta(type):
    filesystems = []

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if name != "FileSystem" and cls.check_installed():
            FileSystemMeta.filesystems.append(cls)

class FileSystem(object):
    """ Base class from which filesystem objects should be derived.

        Note that these are NOT models, they should fetch their information live from
        the file system metadata.

        The volume instance that is formatted with this file system instance can be
        accessed through ``self.lv``.

        Class variables:

         * name: File system type that can be passed to mount -t.
         * desc: Human-readable description.
         * mount_in_fstab: If True, a mount line for this volume will be included in /etc/fstab.
         * virtual: If True, denotes that the file system cannot be dealt with using the
           standard mount/stat/umount stuff, but needs some kind of more advanced treatment.
           E. g., it might reside on a volume that is mapped using iSCSI or FC.
    """

    __metaclass__ = FileSystemMeta

    name = "failfs"
    desc = "failing file system"
    mount_in_fstab = True
    virtual = False

    @classmethod
    def format_blockvolume(cls, volume, options):
        from volumes.models import FileSystemProvider
        vol = FileSystemProvider(storageobj=volume.storageobj, owner=options["owner"], fstype=cls.name,
                                 fswarning=options["fswarning"], fscritical=options["fscritical"])
        vol.full_clean()
        vol.save()
        return vol

    @classmethod
    def configure_blockvolume(cls, volume):
        from django.contrib.auth.models import User
        from volumes.models import FileSystemProvider
        try:
            admin = User.objects.get(username="openattic")
        except User.DoesNotExist:
            admin = User.objects.filter(is_superuser=True)[0]
        vol = FileSystemProvider(storageobj=volume.storageobj, owner=admin, fstype=cls.name,
                                 fswarning=75, fscritical=85)
        vol.full_clean()
        vol.save(database_only=True)
        vol.mount()
        return vol

    class WrongFS(Exception):
        """ Raised when a filesystem handler detects that the volume is formatted with a different fs. """
        pass

    def __init__(self, volume):
        self.volume = volume
        # Make sure virtual FS handlers are only employed on volumes that don't have a native
        # FS configured and vice-versa.
        if not self.virtual:
            from volumes.models import FileSystemProvider
            if isinstance(self.volume, FileSystemProvider) and self.volume.fstype != self.name:
                raise FileSystem.WrongFS(self.name)
        else:
            if self.volume.storageobj.upper is not None:
                raise FileSystem.WrongFS(self.name)

    @property
    def dbus_object(self):
        return get_dbus_object("/volumes")

    @property
    def fsname(self):
        return self.name

    @property
    def path(self):
        if self.virtual:
            raise NotImplementedError("FileSystem::path needs to be overridden for virtual FS handlers")
        if self.volume.storageobj.snapshot is None:
            # not a snapshot -> mount under /media/
            mountdir = volumes_settings.MOUNT_PREFIX
        else:
            # snapshot -> mount under /media/origin/.snapshots/
            origin   = self.volume.storageobj.snapshot.filesystemvolume.volume.fs
            mountdir = os.path.join(origin.path, '.snapshots')
        return os.path.join(mountdir, self.volume.storageobj.name)

    def mount(self):
        """ Mount the file system.
        """
        if self.virtual:
            raise NotImplementedError("FileSystem::mount needs to be overridden for virtual FS handlers")
        dbus_object = get_dbus_object("/volumes")
        if self.volume.storageobj.snapshot is not None:
            # snapshot -> ensure origin is mounted, ensure tmpfs is mounted to .snapshots, then proceed to
            # mounting as usual
            origin = self.volume.storageobj.snapshot.filesystemvolume.volume.fs
            if not origin.mounted:
                origin.mount()
            dbus_object = get_dbus_object("/volumes")
            snapdir = os.path.join(origin.path, ".snapshots")
            if not os.path.exists(snapdir) or not os.path.ismount(snapdir):
                dbus_object.fs_mount( "tmpfs", "tmpfs", snapdir, dbus.Array([], signature="as") )
        dbus_object.fs_mount( self.name, self.volume.storageobj.blockvolume.volume.path, self.path, self.get_mount_options() )

    def get_mount_options(self):
        return dbus.Array([], signature="as")

    @property
    def mounted(self):
        """ True if the volume is currently mounted. """
        if self.virtual:
            raise NotImplementedError("FileSystem::mounted needs to be overridden for virtual FS handlers")
        return os.path.ismount(self.path)

    def unmount(self):
        """ Unmount the volume. """
        if self.virtual:
            raise NotImplementedError("FileSystem::unmount needs to be overridden for virtual FS handlers")
        dbus_object = get_dbus_object("/volumes")
        dbus_object.fs_unmount( self.volume.storageobj.blockvolume.volume.path, self.path )
        if self.volume.storageobj.snapshot is not None:
            # snapshot -> if no other snapshots exist, unmount the tmpfs
            origin = self.volume.storageobj.snapshot
            if origin.snapshot_storageobject_set.count() <= 1:
                snapdir = os.path.join(origin.filesystemvolume.volume.path, ".snapshots")
                dbus_object.fs_unmount( "tmpfs", snapdir )

    def format(self):
        """ Format the volume. """
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, grow):
        """ Resize the file system to the current volume size. """
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    def set_uuid(self, value="", generate=False):
        """ Set the file system's UUID. """
        raise NotImplementedError("FileSystem::set_uuid needs to be overridden")

    def chown(self):
        """ Change ownership of the filesystem to be the LV's owner. """
        if self.virtual:
            raise NotImplementedError("FileSystem::chown needs to be overridden for virtual FS handlers")
        dbus_object = get_dbus_object("/volumes")
        return dbus_object.fs_chown( self.path, self.volume.owner.username, volumes_settings.CHOWN_GROUP )

    def destroy(self):
        """ Destroy the file system. """
        pass

    @property
    def info(self):
        """ Return all file system metadata. """
        raise NotImplementedError("FileSystem::info needs to be overridden")

    @property
    def stat(self):
        """ stat() the file system and return usage statistics. """
        if self.virtual:
            raise NotImplementedError("FileSystem::stat needs to be overridden for virtual FS handlers")
        dbus_object = get_dbus_object("/volumes")
        try:
            return dbus_to_python(dbus_object.fs_stat(self.path))
        except dbus.DBusException:
            return {"size": None, "free": None, "used": None}

    @classmethod
    def check_type(cls, typestring):
        return False

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/mkfs.%s" % cls.name)

    def write_fstab(self, delete=False, id=0):
        """ Update /etc/fstab. """
        dbus_object = get_dbus_object("/volumes")
        return dbus_object.write_fstab(delete, id)

    def grow(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support grow" % self.name)

    def shrink(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support shrink" % self.name)

    def post_grow(self, oldmegs, newmegs):
        pass

    def post_shrink(self, oldmegs, newmegs):
        pass

