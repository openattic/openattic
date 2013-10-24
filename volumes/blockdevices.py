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

class UnsupportedRAID(Exception):
    pass

class UnsupportedRAIDVendor(UnsupportedRAID):
    pass

class UnsupportedRAIDLevel(UnsupportedRAID):
    pass

def get_disk_stats(device):
    """ Get disk stats from `/sys/block/X/stat'. """
    if not os.path.exists( "/sys/block/%s/stat" % device ):
        raise SystemError( "No such device: '%s'" % device )

    fd = open("/sys/block/%s/stat" % device, "rb")
    try:
        stats = fd.read().split()
    finally:
        fd.close()

    return dict( zip( [
        "reads_completed",  "reads_merged",  "sectors_read",    "millisecs_reading",
        "writes_completed", "writes_merged", "sectors_written", "millisecs_writing",
        "ios_in_progress",  "millisecs_in_io", "weighted_millisecs_in_io"
        ], [ int(num) for num in stats ] ) )
