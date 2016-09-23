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

import os
import os.path
import json
import re

from django.core.cache import get_cache
from django.template.loader import render_to_string

from ceph.models import CephCluster, CephPool, CephRbd, fsid_context
from ifconfig.models import Host
from systemd.procutils import invoke
from systemd.plugins import logged, BasePlugin, method, deferredmethod


@logged
class SystemD(BasePlugin):
    dbus_path = "/ceph"

    def invoke_ceph(self, cluster, args, log=True):
        return invoke(["ceph", "--format", "json", "--cluster", cluster] + args, log=log,
                      return_out_err=True)

    @method(in_signature="s", out_signature="s")
    def osd_crush_dump(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["osd", "crush", "dump"], log=False)
        return out

    @deferredmethod(in_signature="sss")
    def osd_crush_add_bucket(self, cluster, bucketname, buckettype, sender):
        self.invoke_ceph(cluster, ["osd", "crush", "add-bucket", bucketname, buckettype])

    @deferredmethod(in_signature="ssss")
    def osd_crush_move(self, cluster, bucketname, parenttype, parentname, sender):
        self.invoke_ceph(cluster, ["osd", "crush", "move", bucketname,
                                   "%s=%s" % (parenttype, parentname)])

    @method(in_signature="s", out_signature="s")
    def osd_dump(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["osd", "dump"], log=False)
        return out

    @method(in_signature="s", out_signature="s")
    def mds_stat(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["mds", "stat"], log=False)
        return out

    @method(in_signature="s", out_signature="s")
    def mds_dump(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["mds", "dump"], log=False)
        return out

    @method(in_signature="s", out_signature="s")
    def mon_status(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["mon_status"], log=False)
        return out

    @method(in_signature="s", out_signature="s")
    def auth_list(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["auth", "list"], log=False)
        return out

    @method(in_signature="ss", out_signature="")
    def auth_add(self, cluster, entity):
        self.invoke_ceph(cluster, ["auth", "add", entity])

    @method(in_signature="ss", out_signature="s")
    def auth_get_key(self, cluster, entity):
        ret, out, err = self.invoke_ceph(cluster, ["auth", "get-key", entity], log=False)
        return out

    @method(in_signature="ss", out_signature="")
    def auth_del(self, cluster, entity):
        self.invoke_ceph(cluster, ["auth", "del", entity])

    @method(in_signature="s", out_signature="s")
    def status(self, cluster):
        out = get_cache("systemd").get("ceph_status:%s" % cluster)
        if out is None:
            ret, out, err = self.invoke_ceph(cluster, ["status"], log=False)
            get_cache("systemd").set("ceph_status:%s" % cluster, out, 15)
        return out

    @method(in_signature="s", out_signature="s")
    def df(self, cluster):
        out = get_cache("systemd").get("ceph_df:%s" % cluster)
        if out is None:
            ret, out, err = self.invoke_ceph(cluster, ["df"], log=False)
            get_cache("systemd").set("ceph_df:%s" % cluster, out, 15)
        return out

    @deferredmethod(in_signature="sssi")
    def rbd_create(self, cluster, pool, image, megs, sender):
        invoke(["rbd", "-c", "/etc/ceph/%s.conf" % cluster, "-p", pool, "create", image, "--size",
                str(megs)])

    @deferredmethod(in_signature="sss")
    def rbd_rm(self, cluster, pool, image, sender):
        invoke(["rbd", "-c", "/etc/ceph/%s.conf" % cluster, "-p", pool, "rm", image])

    @deferredmethod(in_signature="sss")
    def rbd_map(self, cluster, pool, image, sender):
        invoke(["rbd", "-c", "/etc/ceph/%s.conf" % cluster, "-p", pool, "map", image])

    @deferredmethod(in_signature="sss")
    def rbd_unmap(self, cluster, pool, image, sender):
        invoke(["rbd", "-c", "/etc/ceph/%s.conf" % cluster, "unmap",
                "/dev/rbd/%s/%s" % (pool, image)])

    @method(in_signature="s", out_signature="s")
    def rbd_showmapped(self, cluster):
        ret, out, err = invoke(["rbd", "-c", "/etc/ceph/%s.conf" % cluster, "showmapped"],
                               log=False, return_out_err=True)
        return out

    @deferredmethod(in_signature="sss")
    def format_volume_as_osd(self, cluster, fspath, journaldev, sender):
        # run "ceph osd create" to get an ID
        ret, out, err = self.invoke_ceph(cluster, ["osd", "create"])
        osdid = json.loads(out)["osdid"]
        # symlink the file system to /var/lib/ceph/osd/<cluster>-<id>
        osdpath = "/var/lib/ceph/osd/%s-%d" % (cluster, osdid)
        os.symlink(fspath, osdpath)
        # symlink the journal device to .../journal if we have one, otherwise use a file
        if journaldev:
            os.symlink(journaldev, os.path.join(osdpath, "journal"))
        else:
            open(os.path.join(osdpath, "journal"), "w").close()
        try:
            # create the OSD's file system
            invoke(["ceph-osd", "-c", "/etc/ceph/%s.conf" % cluster, "-i", str(osdid), "--mkfs",
                    "--mkkey"])
            # create .../sysvinit so the OSD starts on boot
            open(os.path.join(osdpath, "sysvinit"), "w").close()
            # create auth entity with the keyring generated by ceph-osd
            self.invoke_ceph(cluster, ["auth", "add", "osd.%d" % osdid,
                                       "osd", "allow *", "mon", "allow rwx",
                                       "-i", os.path.join(osdpath, "keyring")])
            # ogo
            invoke(["service", "ceph", "start", "osd.%d" % osdid])
        except SystemError:
            # some error occurred. make sure we can re-run this command safely and don't
            # leave any stale OSD IDs in ceph by `rm -rf`ing the OSD directory and deleting
            # the OSD from ceph.
            # see https://docs.python.org/2/library/os.html#os.walk
            for root, dirs, files in os.walk(fspath, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.unlink(osdpath)
            self.invoke_ceph(cluster, ["osd", "rm", str(osdid)])

    @deferredmethod(in_signature="ssii")
    def osd_pool_create(self, cluster, poolname, pg_num, ruleset, sender):
        self.invoke_ceph(cluster, ["osd", "pool", "create", poolname, str(pg_num), str(pg_num),
                                   "replicated", str(ruleset)])

    @deferredmethod(in_signature="ss")
    def osd_pool_delete(self, cluster, poolname, sender):
        self.invoke_ceph(cluster, ["osd", "pool", "delete", poolname, poolname,
                                   "--yes-i-really-really-mean-it"])

    @deferredmethod(in_signature="ssss")
    def osd_pool_set(self, cluster, poolname, key, value, sender):
        self.invoke_ceph(cluster, ["osd", "pool", "set", poolname, key, value])

    @method(in_signature="s", out_signature="s")
    def ceph_fsid(self, cluster):
        ret, out, err = self.invoke_ceph(cluster, ["fsid"])
        return out

    @deferredmethod(in_signature="(s)")
    def remove_nagios_configs(self, objects_to_delete, sender):
        """
        Deletes existing Nagios config files for Ceph cluster objects by object list.
        :param objects_to_delete: Which objects should the config be deleted for? - Possible values
               are: "cluster", "pool" and "all". If you choose "all" the configs of all known
               objects are deleted.
        :rtype: list[str]
        :param sender: Unique ID of DBUS sender object.
        :rtype: str
        :return: None
        """
        from nagios.conf.settings import NAGIOS_SERVICES_CFG_PATH

        rgx = {"cluster": r"^cephcluster_[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}.cfg$",
               "pool": r"^cephpool_[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}_[\w]+.cfg$",
               "rbd": r"^cephrbd_[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}_[\w]+_[\w]+.cfg$"}

        if len(objects_to_delete) == 1 and objects_to_delete[0] == "all":
            objects_to_delete = rgx.keys()

        for conf_file in os.listdir(NAGIOS_SERVICES_CFG_PATH):
            for delete in objects_to_delete:
                if re.match(rgx[delete], conf_file):
                    path = os.path.join(NAGIOS_SERVICES_CFG_PATH, conf_file)
                    os.remove(path)

    @deferredmethod(in_signature="")
    def write_cluster_nagios_configs(self, sender):
        for cluster in CephCluster.objects.all():
            cluster_file_name = "cephcluster_{}.cfg".format(cluster.fsid)
            cluster_services = [self._gen_service_data(cluster.__class__.__name__, cluster.fsid, 5)]
            self._write_services_to_file(cluster_file_name, cluster_services)

    @deferredmethod(in_signature="")
    def write_pool_nagios_configs(self, sender):
        for cluster in CephCluster.objects.all():
            with fsid_context(cluster.fsid):
                for pool in CephPool.objects.all():
                    pool_file_name = "cephpool_{}_{}.cfg".format(cluster.fsid, pool.name)
                    pool_services = [self._gen_service_data(
                        pool.__class__.__name__,
                        "{} {}".format(cluster.fsid, pool.name), 5)]
                    self._write_services_to_file(pool_file_name, pool_services)

    @deferredmethod(in_signature="")
    def write_rbd_nagios_configs(self, sender):
        for cluster in CephCluster.objects.all():
            with fsid_context(cluster.fsid):
                for pool in CephPool.objects.all():
                    for rbd in CephRbd.objects.filter(pool__name=pool.name):
                        rbd_file_name = "cephrbd_{}_{}_{}.cfg".format(cluster.fsid, pool.name,
                                                                      rbd.name)
                        rbd_services = [self._gen_service_data(
                            rbd.__class__.__name__,
                            "{} {} {}".format(cluster.fsid, pool.name, rbd.name), 30)]
                        self._write_services_to_file(rbd_file_name, rbd_services)

    def _gen_service_data(self, service_instance_name, service_arguments, check_interval):
        class _CephService(object):

            def __init__(self, desc, command_name, args, check_interval):
                self.description = desc
                self.arguments = args
                self.active = True
                self.normal_check_interval = check_interval

                command = self._CephCommand(command_name)
                self.command = command

            class _CephCommand(object):
                def __init__(self, name):
                    self.name = name

        service_desc = "Check {} {}".format(service_instance_name, service_arguments)
        service_command = "check_{}".format(str.lower(service_instance_name))

        return _CephService(service_desc, service_command, service_arguments, check_interval)

    def _write_services_to_file(self, file_name, services):
        from nagios.conf.settings import NAGIOS_SERVICES_CFG_PATH
        path = os.path.join(NAGIOS_SERVICES_CFG_PATH, file_name)

        with open(path, "wb") as config_file:
            config_file.write(render_to_string("nagios/services.cfg", {
                "IncludeHost": False,
                "Host": Host.objects.get_current(),
                "Services": services
            }))
