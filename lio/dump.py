# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rtslib.root   import RTSRoot

r = RTSRoot()

for backstore in r.backstores:
    print "Backstore:", backstore.name
    for storage_object in backstore.storage_objects:
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
                print "          -> LUN %s" % lun.storage_object.udev_path
            for portal in tpg.network_portals:
                print "          -> Portal %s:%s" % (portal.ip_address, portal.port)
