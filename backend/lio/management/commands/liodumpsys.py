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

from rtslib.root   import RTSRoot

from django.core.management.base import BaseCommand

class Command( BaseCommand ):
    help = "Dump the current LIO system object structure."

    def handle(self, **options):
        r = RTSRoot()

        print "Storage Objects:"
        for storage_object in r.storage_objects:
            try:
                print "    -> %s (%s, WWN=%s, backstore=%s)" % (storage_object.name, storage_object.udev_path, storage_object.wwn, storage_object.backstore.name)
            except AttributeError:
                print "    -> %s (%s, WWN=%s)" % (storage_object.name, storage_object.udev_path, storage_object.wwn)

        for fabric in r.fabric_modules:
            print "Fabric:", fabric.name
            for target in fabric.targets:
                print "    -> Target %s=%s" % (target.wwn_type, target.wwn)
                for tpg in target.tpgs:
                    print "       -> TPG %s" % tpg.tag
                    for acl in tpg.node_acls:
                        print "          -> ACL %s" % acl.node_wwn
                        for mlun in acl.mapped_luns:
                            print "              -> Mapped LUN %d: %s" % (mlun.mapped_lun, mlun.tpg_lun.storage_object.udev_path)
                    for lun in tpg.luns:
                        print "          -> LUN %s (%d)" % (lun.storage_object.udev_path, lun.lun)
                    for portal in tpg.network_portals:
                        print "          -> Portal %s:%s" % (portal.ip_address, portal.port)
