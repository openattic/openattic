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

from __future__ import division

import sys
import socket
import errno

from xmlrpclib import Fault

from lvm.filesystems import FileSystem, FILESYSTEMS

class FileSystemProxy(FileSystem):
    name = "LIO Remote Filesystem"
    description = "Proxy for a filesystem on an iSCSI/FC Initiator"
    mount_in_fstab = False
    virtual = True

    def __init__(self, logical_volume):
        FileSystem.__init__(self, logical_volume)
        self.disk = None

        from lio.models import StorageObject, LUN, ACL
        for storageobj in StorageObject.all_objects.filter(volume=self.lv):
            for lun in LUN.all_objects.filter(storageobj=storageobj):
                for acl in ACL.all_objects.filter(tpg=lun.tpg):
                    for peer in acl.initiator.host.peerhost_set.all():
                        try:
                            self.disk = peer.disk.finddisk(peer.host.name, self.lv.uuid)
                            self.disk["__peer__host__name__"] = peer.host.name
                        except socket.error, err:
                            if err.errno in (errno.ECONNREFUSED, errno.ECONNABORTED, errno.ECONNRESET,
                                    errno.EHOSTUNREACH, errno.ENETUNREACH, errno.ETIMEDOUT) or isinstance(err, socket.timeout):
                                print >> sys.stderr, "Connection to %s failed: %s" % (peer.host.name, err)
                                continue
                            else:
                                raise
                        except Fault, flt:
                            continue

        if self.disk is None:
            raise FileSystem.WrongFS(self.name)

    @property
    def fsname(self):
        return self.disk["__partitions__"][0]["FileSystem"]

    @property
    def mountpoint(self):
        return self.disk["__partitions__"][0]["Name"]

    @property
    def mounthost(self):
        return self.disk["SystemName"]

    def mount(self, jid):
        """ Mount the file system.
        """
        raise NotImplementedError("Remote mount is not (yet?) implemented")

    @property
    def mounted(self):
        """ True if the volume is currently mounted. """
        return True

    def unmount(self, jid):
        """ Unmount the volume. """
        raise NotImplementedError("Remote unmount is not (yet?) implemented")

    @property
    def info(self):
        """ Return all file system metadata. """
        return self.disk

    def stat(self):
        """ stat() the file system and return usage statistics. """
        btsize = int(self.disk["Size"])
        btfree = sum([ int(part["FreeSpace"]) for part in self.disk["__partitions__"] ])
        btused = btsize - btfree
        return {
            "used":  btused / 1024**2,
            "free":  btfree / 1024**2,
            "size":  btsize / 1024**2,
            "usedG": btused / 1024**3,
            "freeG": btfree / 1024**3,
            "sizeG": btsize / 1024**3,
            }

FILESYSTEMS.append(FileSystemProxy)
