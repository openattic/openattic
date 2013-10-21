# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

    def clean_volume(self, volume):
        pass

    @property
    def fsname(self):
        return self.name

    @property
    def path(self):
        if self.virtual:
            raise NotImplementedError("FileSystem::path needs to be overridden for virtual FS handlers")
        return os.path.join(volumes_settings.MOUNT_PREFIX, self.volume.volume.name)

    @property
    def mounthost(self):
        if self.virtual:
            raise NotImplementedError("FileSystem::mounthost needs to be overridden for virtual FS handlers")
        return self.volume.volume.host

    def mount(self, jid):
        """ Mount the file system.
        """
        if self.virtual:
            raise NotImplementedError("FileSystem::mount needs to be overridden for virtual FS handlers")
        self._lvm.fs_mount( jid, self.name, self.volume.device, self.path )

    @property
    def mounted(self):
        """ True if the volume is currently mounted. """
        if self.virtual:
            raise NotImplementedError("FileSystem::mounted needs to be overridden for virtual FS handlers")
        return os.path.ismount(self.path)

    def unmount(self, jid):
        """ Unmount the volume. """
        if self.virtual:
            raise NotImplementedError("FileSystem::unmount needs to be overridden for virtual FS handlers")
        self._lvm.fs_unmount( jid, self.volume.device, self.path )

    def format(self, jid):
        """ Format the volume. """
        raise NotImplementedError("FileSystem::format needs to be overridden")

    def resize(self, jid, grow):
        """ Add a command to the job with the given ``jid`` to resize the file system
            to the current volume size.
        """
        raise NotImplementedError("FileSystem::resize needs to be overridden")

    def chown(self, jid):
        """ Change ownership of the filesystem to be the LV's owner. """
        if self.virtual:
            raise NotImplementedError("FileSystem::chown needs to be overridden for virtual FS handlers")
        return self._lvm.fs_chown( jid, self.path, self.volume.upper.owner.username, volumes_settings.CHOWN_GROUP )

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
        s = os.statvfs(self.path)
        stats = {
            'size': (s.f_blocks * s.f_frsize) / 1024 / 1000.,
            'free': (s.f_bavail * s.f_frsize) / 1024 / 1000.,
            'used': ((s.f_blocks - s.f_bfree) * s.f_frsize) / 1024 / 1000.,
            }
        stats['sizeG'] = stats['size'] / 1024.
        stats['freeG'] = stats['free'] / 1024.
        stats['usedG'] = stats['used'] / 1024.
        return stats

    @classmethod
    def check_type(cls, typestring):
        return False

    @classmethod
    def check_installed(cls):
        return os.path.exists("/sbin/mkfs.%s" % cls.name)

