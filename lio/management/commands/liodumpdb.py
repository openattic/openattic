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
import socket

from django.core.management.base import BaseCommand

from lio.models import HostACL
from volumes.models import BlockVolume

class Command( BaseCommand ):
    help = "Dump the current LIO database object structure."

    def handle(self, **options):
        localname = socket.gethostname().split(".")[0]
        localarch = os.uname()[4].replace("_", "")
        prefix = "iqn.2003-01.org.linux-iscsi.%s.%s" % (localname, localarch)
        prefix = prefix.strip().lower()

        print "Storage Objects:"
        for blockvolume in BlockVolume.objects.filter(hostacl__isnull=False).distinct():
            print "    -> %s (%s, WWN=%s)" % (blockvolume.storageobj.name, blockvolume.volume.path, blockvolume.storageobj.uuid)

        print "Fabric: iscsi"
        for hostacl in HostACL.objects.filter(host__initiator__type="iscsi"):
            volume_name = hostacl.volume.storageobj.name
            tgt_wwn = "%s:%s" % (prefix, volume_name.replace("_", "").replace(" ", ""))
            print "    -> Target iqn=%s" % tgt_wwn
            print "       -> TPG 1"
            for initiator in hostacl.host.initiator_set.filter(type="iscsi"):
                print "          -> ACL %s (%d)" % (initiator.wwn, hostacl.id)
                print "              -> Mapped LUN %d: %s" % (hostacl.lun_id, hostacl.volume.volume.path)
            for portal in hostacl.portals.all():
                print "          -> Portal %s" % portal

        print "Fabric: qla2xxx"
        print "    -> Target free=UNKNOWN"
        print "       -> TPG 1"
        for hostacl in HostACL.objects.filter(host__initiator__type="qla2xxx"):
            for initiator in hostacl.host.initiator_set.filter(type="qla2xxx"):
                print "          -> ACL %s (%d)" % (initiator.wwn, hostacl.id)
                print "              -> Mapped LUN %d: %s" % (hostacl.lun_id, hostacl.volume.volume.path)
