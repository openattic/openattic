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

from __future__ import division

import sys
import socket
import errno

from xmlrpclib import Fault

from volumes.filesystems import FileSystem, FILESYSTEMS

class FileSystemProxy(FileSystem):
    description = "Proxy for a filesystem on an iSCSI/FC Initiator"
    mount_in_fstab = False
    virtual = True

    def __init__(self, logical_volume):
        FileSystem.__init__(self, logical_volume)
        self.disk = None
        self.host = None

        from lio.models import StorageObject, LUN, ACL
        for storageobj in StorageObject.all_objects.filter(volume=self.lv):
            for lun in LUN.all_objects.filter(storageobj=storageobj):
                for acl in ACL.all_objects.filter(tpg=lun.tpg):
                    for peer in acl.initiator.host.peerhost_set.all():
                        try:
                            self.disk = peer.disk.finddisk('.', self.lv.uuid)
                            self.host = peer.host
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
    def name(self):
        if "fs_type" not in self.disk:
            return "LIO Remote File System"
        if self.disk["fs_type"] == "unknown":
            return ""
        if self.disk["fs_type"] == "partition_table":
            return self.disk["partitions"][0]["fs_type"]
        return self.disk["fs_type"]

    @property
    def path(self):
        if "fs_type" not in self.disk:
            return ""
        if self.disk["fs_type"] == "unknown":
            return ""
        if self.disk["fs_type"] == "partition_table" and "mountpoint" in self.disk["partitions"][0]:
            return self.disk["partitions"][0]["mountpoint"]
        return self.disk["mountpoint"]

    def mount(self):
        """ Mount the file system.
        """
        raise NotImplementedError("Remote mount is not (yet?) implemented")

    @property
    def mounted(self):
        """ True if the volume is currently mounted. """
        return self.name != "LIO Remote File System"

    def unmount(self):
        """ Unmount the volume. """
        raise NotImplementedError("Remote unmount is not (yet?) implemented")

    @property
    def info(self):
        """ Return all file system metadata. """
        return self.disk

    @property
    def stat(self):
        """ stat() the file system and return usage statistics. """
        if "fs_type" not in self.disk:
            return None

        stat = {
            "size":  self.disk["megs"],
            "sizeG": self.disk["megs"] / 1024
        }

        if self.disk["fs_type"] == "partition_table":
            megs = 0
            megs_free = 0
            for part in self.disk["partitions"]:
                if "megs_free" not in part:
                    # no way to determine megs_free if we have a partition for which it's unknown
                    break
                megs_free += part["megs_free"]
                megs      += part["megs"]
            else: # if we didn't hit any breaks, megs_free is valid
                stat["size"]  = megs
                stat["sizeG"] = megs / 1024
                stat["free"]  = megs_free
                stat["freeG"] = megs_free / 1024

        elif "megs_free" in self.disk:
            stat["free"]  = self.disk["megs_free"]
            stat["freeG"] = self.disk["megs_free"] / 1024

        if "free" in stat:
            stat["used"]  = stat["size"]  - stat["free"]
            stat["usedG"] = stat["sizeG"] - stat["freeG"]

        return stat

