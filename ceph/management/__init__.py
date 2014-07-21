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

import re
import json
import sysutils.models

from ConfigParser import ConfigParser

from django.contrib.auth.models import User

from systemd import get_dbus_object, dbus_to_python
from ifconfig.models import Host, IPAddress
from ceph import models as ceph_models


def update(**kwargs):
    admin = User.objects.filter( is_superuser=True )[0]

    conf = ConfigParser()
    if not conf.read("/etc/ceph/ceph.conf"):
        print "There doesn't seem to be a ceph cluster here, skipping detection"
        return

    print "Checking Ceph cluster %s..." % conf.get("global", "fsid"),
    try:
        cluster = ceph_models.Cluster.objects.get(uuid=conf.get("global", "fsid"))
        print "known"
    except ceph_models.Cluster.DoesNotExist:
        cluster = ceph_models.Cluster(uuid=conf.get("global", "fsid"), displayname="ceph",
                                      auth_cluster_required = conf.get("global", "auth_cluster_required"),
                                      auth_service_required = conf.get("global", "auth_service_required"),
                                      auth_client_required  = conf.get("global", "auth_client_required"),
                                      )
        cluster.full_clean()
        cluster.save()
        print "added"

    osdmap   = json.loads(dbus_to_python(get_dbus_object("/ceph").osd_dump(cluster.displayname)))
    crushmap = json.loads(dbus_to_python(get_dbus_object("/ceph").osd_crush_dump(cluster.displayname)))
    mds_stat = json.loads(dbus_to_python(get_dbus_object("/ceph").mds_stat(cluster.displayname)))
    mon_stat = json.loads(dbus_to_python(get_dbus_object("/ceph").mon_status(cluster.displayname)))
    auth_list= json.loads(dbus_to_python(get_dbus_object("/ceph").auth_list(cluster.displayname)))

    for ctype in crushmap["types"]:
        print "Checking ceph type '%s'..." % ctype["name"],
        try:
            mdltype = ceph_models.Type.objects.get(cluster=cluster, ceph_id=ctype["type_id"])
            print "known"
        except ceph_models.Type.DoesNotExist:
            mdltype = ceph_models.Type(cluster=cluster, ceph_id=ctype["type_id"], name=ctype["name"])
            mdltype.full_clean()
            mdltype.save()
            print "added"

    buckets = crushmap["buckets"][:]
    osdbuckets = {}
    while buckets:
        cbucket = buckets.pop(0)

        # First make sure the bucket is known to the DB.
        print "Checking ceph bucket '%s %s'..." % (cbucket["type_name"], cbucket["name"]),
        try:
            mdlbucket = ceph_models.Bucket.objects.get(cluster=cluster, ceph_id=cbucket["id"])
            print "known"
        except ceph_models.Bucket.DoesNotExist:
            mdltype   = ceph_models.Type.objects.get(cluster=cluster, ceph_id=cbucket["type_id"])
            mdlbucket = ceph_models.Bucket(cluster=cluster, ceph_id=cbucket["id"], type=mdltype,
                                           name=cbucket["name"], alg=cbucket["alg"], hash=cbucket["hash"])
            mdlbucket.full_clean()
            mdlbucket.save()
            print "added"

        # Now check dependencies.
        for member in cbucket["items"]:
            if member["id"] >= 0:
                print "We're parent for OSD %d..." % member["id"],
                for cdevice in crushmap["devices"]:
                    if cdevice["id"] == member["id"]:
                        osdbuckets[ cdevice["name"] ] = mdlbucket
                        print "found"
                        break
                else:
                    print "not found"
                continue

            print "We're parent for Bucket %d..." % member["id"],
            try:
                mdlmember = ceph_models.Bucket.objects.get(cluster=cluster, ceph_id=member["id"])
            except ceph_models.Bucket.DoesNotExist:
                # Member bukkit has not yet been entered into the DB, so re-visit us later.
                buckets.append(cbucket)
                print "retry"
                break
            else:
                # Member is known, set the parent field.
                if mdlmember.parent != mdlbucket:
                    mdlmember.parent = mdlbucket
                    mdlmember.full_clean()
                    mdlmember.save()
                    print "added"
                else:
                    print "known"

    for cosd in osdmap["osds"]:
        print "Checking Ceph OSD %d..." % cosd["osd"],
        try:
            mdlosd = ceph_models.OSD.objects.get(cluster=cluster, ceph_id=cosd["osd"])
            print "known"
        except ceph_models.OSD.DoesNotExist:
            osdname = "osd.%d" % cosd["osd"]
            mdlosd = ceph_models.OSD(cluster=cluster, ceph_id=cosd["osd"], uuid=cosd["uuid"], bucket=osdbuckets[osdname], is_by_oa=False)
            mdlosd.full_clean()
            mdlosd.save()
            print "added"

    for cpool in osdmap["pools"]:
        print "Checking Ceph pool %s..." % cpool["pool_name"],
        try:
            mdlpool = ceph_models.Pool.objects.get(cluster=cluster, ceph_id=cpool["pool"])
            print "known"
        except ceph_models.Pool.DoesNotExist:
            mdlpool = ceph_models.Pool(cluster=cluster, ceph_id=cpool["pool"], name=cpool["pool_name"], size=cpool["size"],
                                       min_size=cpool["min_size"], pg_num=cpool["pg_num"], pgp_num=cpool["pg_placement_num"])
            mdlpool.full_clean()
            mdlpool.save()
            print "added"

    iprgx = re.compile(r"^(?P<ip>.+):(?P<port>\d+)/\d+$")
    for cmds in mds_stat["mdsmap"]["info"].values():
        print "Checking Ceph mds %s..." % cmds["name"],

        m = iprgx.match(cmds["addr"])
        try:
            ip = IPAddress.objects.get(address__startswith=m.group("ip"))
        except IPAddress.DoesNotExist:
            print "Host unknown, ignored"
            continue

        try:
            mdlmds = ceph_models.MDS.objects.get(cluster=cluster, host=ip.device.host)
            print "found"
        except ceph_models.MDS.DoesNotExist:
            mdlmds = ceph_models.MDS(cluster=cluster, host=ip.device.host, is_by_oa=False)
            mdlmds.full_clean()
            mdlmds.save()
            print "added"

    for cmon in mon_stat["monmap"]["mons"]:
        print "Checking Ceph mon %s..." % cmon["name"],

        m = iprgx.match(cmon["addr"])
        try:
            ip = IPAddress.objects.get(address__startswith=m.group("ip"))
        except IPAddress.DoesNotExist:
            print "Host unknown, ignored"
            continue

        try:
            mdlmon = ceph_models.Mon.objects.get(cluster=cluster, host=ip.device.host)
            print "found"
        except ceph_models.Mon.DoesNotExist:
            mdlmon = ceph_models.Mon(cluster=cluster, host=ip.device.host, is_by_oa=False)
            mdlmon.full_clean()
            mdlmon.save()
            print "added"

    for centity in auth_list["auth_dump"]:
        print "Checking Ceph auth entity %s..." % centity["entity"],

        try:
            mdlentity = ceph_models.Entity.objects.get(entity=centity["entity"])
            print "found"
        except ceph_models.Entity.DoesNotExist:
            mdlentity = ceph_models.Entity(cluster=cluster, entity=centity["entity"], key=centity["key"])
            mdlentity.full_clean()
            mdlentity.save()
            print "added"


sysutils.models.post_install.connect(update, sender=sysutils.models)
