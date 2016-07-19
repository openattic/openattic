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

import re
import os
import os.path
import sysutils.models

from ConfigParser import ConfigParser

from django.conf import settings
from django.contrib.auth.models import User

from ifconfig.models import IPAddress
from ceph import models as ceph_models
from volumes.models import StorageObject


def update(**kwargs):
    admin = User.objects.filter(is_superuser=True)[0]

    if not os.path.exists("/etc/ceph"):
        print "Ceph does not appear to be installed, skipping detection"
        return

    for fname in os.listdir("/etc/ceph"):
        m = re.match(r'^(?P<displayname>\w+)\.conf$', fname)
        if m is None:
            continue

        displayname = m.group("displayname")

        cluster_defaults = {
            "auth_cluster_required": "cephx",
            "auth_service_required": "cephx",
            "auth_client_required": "cephx"
        }

        conf = ConfigParser(cluster_defaults)

        if not conf.read("/etc/ceph/%s.conf" % displayname):
            print "%s.conf doesn't seem to be a valid config file, skipping" % displayname
            continue

        print "Checking Ceph cluster %s (%s)..." % (displayname, conf.get("global", "fsid")),
        try:
            cluster = ceph_models.Cluster.objects.get(uuid=conf.get("global", "fsid"))
            known = True
            print "known"
        except ceph_models.Cluster.DoesNotExist:
            # since conf.items ensures that defaults come first and overrides later
            # the dict is expected to do the right thing when it encounters the overrriden key
            global_conf = {k.replace(' ', '_'): v for k, v in conf.items('global')}
            cluster = ceph_models.Cluster(
                uuid=conf.get("global", "fsid"), name=displayname,
                auth_cluster_required=global_conf["auth_cluster_required"],
                auth_service_required=global_conf["auth_service_required"],
                auth_client_required=global_conf["auth_client_required"],
            )
            known = False

        osdmap = cluster.get_osdmap()
        mds_dump = cluster.get_mds_dump()
        mon_stat = cluster.get_mon_status()
        auth_list = cluster.get_auth_list()
        df = cluster.df()

        megs = df["stats"]["total_space_megs"]

        if not known:
            cluster.megs = megs
            cluster.full_clean()
            cluster.save()
            print "added"

        for cosd in osdmap["osds"]:
            print "Checking Ceph OSD %d..." % cosd["osd"],
            try:
                mdlosd = ceph_models.OSD.objects.get(cluster=cluster, ceph_id=cosd["osd"])
                print "known"
            except ceph_models.OSD.DoesNotExist:
                osdname = "osd.%d" % cosd["osd"]
                mdlosd = ceph_models.OSD(cluster=cluster, ceph_id=cosd["osd"], uuid=cosd["uuid"])
                mdlosd.full_clean()
                mdlosd.save(database_only=True)
                print "added"

            # If the volume is unknown and this is a local OSD, let's see if we can update that
            osdpath = os.path.join("/var/lib/ceph/osd", "%s-%d" %
                                   (mdlosd.cluster.name, mdlosd.ceph_id))
            if ((mdlosd.volume is None or mdlosd.journal is None) and
                    os.path.exists(osdpath) and os.path.islink(osdpath)):
                volumepath = os.readlink(osdpath)
                journalpath = os.path.join(osdpath, "journal")
                if os.path.exists(journalpath) and os.path.islink(journalpath):
                    journaldevpath = os.readlink(journalpath)
                else:
                    journaldevpath = ""
                dirty = False
                for fsv_so in StorageObject.objects.filter(filesystemvolume__isnull=False):
                    if volumepath.startswith(fsv_so.filesystemvolume.volume.path):
                        mdlosd.volume = fsv_so.filesystemvolume.volume
                        dirty = True
                        break
                for bv_so in StorageObject.objects.filter(blockvolume__isnull=False):
                    if volumepath.startswith(bv_so.blockvolume.volume.path):
                        mdlosd.journal = bv_so.blockvolume.volume
                        dirty = True
                        break
                if dirty:
                    mdlosd.full_clean()
                    mdlosd.save()

        for cpool in osdmap["pools"]:
            print "Checking Ceph pool %s..." % cpool["pool_name"],
            try:
                mdlpool = ceph_models.Pool.objects.get(cluster=cluster, ceph_id=cpool["pool"])
                print "known"
                mdlpool.save(database_only=True)
            except ceph_models.Pool.DoesNotExist:
                storageobj = StorageObject(name=cpool["pool_name"], megs=megs)
                storageobj.full_clean()
                storageobj.save()
                mdlpool = ceph_models.Pool(cluster=cluster, ceph_id=cpool["pool"],
                                           storageobj=storageobj, size=cpool["size"],
                                           min_size=cpool["min_size"])
                mdlpool.full_clean()
                mdlpool.save(database_only=True)
                print "added"

        iprgx = re.compile(r"^(?P<ip>.+):(?P<port>\d+)/\d+$")
        for cmds in mds_dump["info"].values():
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
                mdlmds = ceph_models.MDS(cluster=cluster, host=ip.device.host)
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
                mdlmon = ceph_models.Mon(cluster=cluster, host=ip.device.host)
                mdlmon.full_clean()
                mdlmon.save()
                print "added"

        for centity in auth_list["auth_dump"]:
            print "Checking Ceph auth entity %s..." % centity["entity"],

            try:
                mdlentity = ceph_models.Entity.objects.get(entity=centity["entity"])
                print "found"
            except ceph_models.Entity.DoesNotExist:
                mdlentity = ceph_models.Entity(cluster=cluster, entity=centity["entity"],
                                               key=centity["key"])
                mdlentity.full_clean()
                mdlentity.save(database_only=True)
                print "added"

    if "nagios" in settings.INSTALLED_APPS:
        from systemd import get_dbus_object

        print "Updating Nagios configs: adding detected Ceph clusters"

        ceph = get_dbus_object("/ceph")
        nagios = get_dbus_object("/nagios")

        ceph.remove_nagios_configs()
        ceph.write_all_nagios_configs()
        nagios.restart_service()
    else:
        print "Nagios does not appear to be installed, skipping adding Ceph clusters"


sysutils.models.post_install.connect(update, sender=sysutils.models)
