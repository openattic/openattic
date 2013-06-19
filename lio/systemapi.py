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

from rtslib.root   import RTSRoot
from rtslib.target import FabricModule, Target, TPG
from rtslib.tcm    import IBlockBackstore, FileIOBackstore

from systemd       import invoke, logged, LockingPlugin, method

from lio.models    import Backstore, Target, Portal, TPG, LUN, ACL


@logged
class SystemD(LockingPlugin):
    dbus_path = "/lio"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        invoke(["echo", "ohai"])
