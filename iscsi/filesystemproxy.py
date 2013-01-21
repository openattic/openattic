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

from lvm.filesystems import FileSystem

class FileSystemProxy(FileSystem):
    name = "iSCSI Remote Filesystem"
    description = "Proxy for a filesystem on an iSCSI Initiator"
    mount_in_fstab = False

    def __init__(self, logical_volume):
        FileSystem.__init__(self, logical_volume)
        self.disk = None
        for lun in self.lv.lun_set.all():
            for initiator in lun.target.init_allow.all():
                if initiator.peer is None:
                    continue
                try:
                    self.disk = initiator.peer.disk.finddisk(initiator.name, self.lv.uuid)
                except socket.error, err:
                    if err.errno in (errno.ECONNREFUSED, errno.ECONNABORTED, errno.ECONNRESET,
                            errno.EHOSTUNREACH, errno.ENETUNREACH, errno.ETIMEDOUT):
                        print >> sys.stderr, "Connection to %s (peer %s) failed: %s" % (initiator.name, initiator.peer.name, err)
                        continue
                    else:
                        raise

    def update(self, data):
        if self.disk is None:
            return data

        btsize = int(self.disk["Size"])
        btfree = sum([ int(part["FreeSpace"]) for part in self.disk["__partitions__"] ])
        btused = btsize - btfree
        data['fs'] = {
            "stat": {
                "used":  btused / 1024**2,
                "free":  btfree / 1024**2,
                "size":  btsize / 1024**2,
                "usedG": btused / 1024**3,
                "freeG": btfree / 1024**3,
                "sizeG": btsize / 1024**3,
                }
            }
        data["filesystem"] = self.disk["__partitions__"][0]["FileSystem"]
        data["name"] = "%s (\\\\%s\%s)" % (data["name"], self.disk["SystemName"], self.disk["__partitions__"][0]["Name"])
        return data
