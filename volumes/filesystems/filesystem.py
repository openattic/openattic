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

from systemd import get_dbus_object
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

    class WrongFS(Exception):
        """ Raised when a filesystem handler detects that the volume is formatted with a different fs. """
        pass

    def __init__(self, volume):
        self.volume = volume
        # Make sure virtual FS handlers are only employed on volumes that don't have a native
        # FS configured and vice-versa.
        if not self.virtual:
            from volumes.models import BlockVolume
            if (isinstance(self.volume, BlockVolume)
                and ( self.volume.upper is None
                      or not hasattr(self.volume.upper, "filesystem")
                      or self.volume.upper.filesystem != self.name )):
                raise FileSystem.WrongFS(self.name)
        else:
            if self.volume.upper is not None:
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
        return os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.storageobj.name)

    def mount(self):
        """ Mount the file system.
        """
        if self.virtual:
            raise NotImplementedError("FileSystem::mount needs to be overridden for virtual FS handlers")
        dbus_object = get_dbus_object("/volumes")
        dbus_object.fs_mount( self.name, self.volume.storageobj.blockvolume.volume.path, self.path )

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

    def format(self):
        """ Format the volume. """
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, grow):
        """ Resize the file system to the current volume size. """
        raise NotImplementedError("FileSystem::resize needs to be overridden")

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
        if not self.mounted:
            return {'size': None, 'free': None, 'used': None}
        s = os.statvfs(self.path)
        stats = {
            'size': (s.f_blocks * s.f_frsize) / 1024. / 1024.,
            'free': (s.f_bavail * s.f_frsize) / 1024. / 1024.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024. / 1024.,
            }
        return stats

    @classmethod
    def check_type(cls, typestring):
        return False

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/mkfs.%s" % cls.name)

    def write_fstab(self):
        """ Update /etc/fstab. """
        dbus_object = get_dbus_object("/volumes")
        return dbus_object.write_fstab()

