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

from django.core.management.base import BaseCommand

from lio.models import Backstore, Target, TARGET_TYPE_CHOICES

class Command( BaseCommand ):
    help = "Dump the current LIO database object structure."

    def handle(self, **options):
        r = RTSRoot()

        for backstore in Backstore.objects.all():
            print "Backstore: %s%d" % (backstore.type, backstore.store_id)
            for storage_object in backstore.storageobject_set.all():
                print "    -> %s (%s, WWN=%s)" % (storage_object.volume.name, storage_object.volume.path, storage_object.wwn)

        for fabricname, fabricdesc in TARGET_TYPE_CHOICES:
            print "Fabric:", fabricname
            for target in Target.objects.filter(type=fabricname):
                print "    -> Target %d: %s = %s" % (target.id, target.name, target.wwn)
                for tpg in target.tpg_set.all():
                    print "       -> TPG %d: %s" % (tpg.id, tpg.tag)
                    for acl in tpg.acl_set.all():
                        print "          -> ACL %d: %s" % (acl.id, acl.initiator.wwn)
                        for mlun in acl.mapped_luns.all():
                            print "              -> Mapped LUN %d: %s" % (mlun.lun_id, mlun.storageobj.volume.path)
                    for lun in tpg.lun_set.all():
                        print "          -> LUN %d: %s" % (lun.id, lun.storageobj.volume.path)
                    for portal in tpg.portals.all():
                        print "          -> Portal %d: %s" % (portal.id, portal)
