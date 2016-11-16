# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

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

from __future__ import division

from rpcd.handlers import BaseHandler, ModelHandler
from rpcd.handlers import ProxyModelHandler

from lvm.models import VolumeGroup, LogicalVolume, LVMetadata, LVSnapshotJob, SnapshotConf
from lvm import blockdevices
from lvm import udevquery
from ifconfig.models import Host
from peering.models import PeerHost
from volumes.rpcapi import AbstractVolumePoolHandler, AbstractBlockVolumeHandler

from rpcd.exceptionhelper import translate_exception
from xmlrpclib import Fault


class DiskHandler(BaseHandler):
    handler_name = "disk"

    def getdisks(self, hostname):
        return udevquery.get_blockdevices()

    def finddisk(self, hostname, diskuuid):
        disks = udevquery.get_blockdevices(diskuuid)
        if not disks:
            raise SystemError("disk not found")
        if len(disks) > 1:
            raise SystemError("more than one disk found")
        return disks[0]


class BlockDevicesHandler(BaseHandler):
    handler_name = "lvm.BlockDevices"

    def get_mounts(self):
        """ Get currently mounted devices. """
        return blockdevices.get_mounts()

    def get_devices(self):
        """ Get all existing devices. """
        return blockdevices.get_devices()

    def is_device_in_use(self, device):
        """ Check if the given device is in use either as a PV, or by being mounted. """
        if device.startswith("/dev"):
            raise ValueError("device must be given without leading /dev")
        return blockdevices.is_device_in_use(device)

    def get_partitions(self, device):
        """ Get all partitions from a given device. """
        return blockdevices.get_partitions(device)

    def get_lvm_capabilities(self):
        return blockdevices.get_lvm_capabilities()


class VgHandler(AbstractVolumePoolHandler):
    model = VolumeGroup
    order = ("storageobj__name",)

    def create(self, data):
        if "host" not in data:
            data["host"] = self._get_handler_instance(Host).current_id()
        return ModelHandler.create(self, data)

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        vg = VolumeGroup.objects.get(id=id)
        return vg.lvm_info

    def get_free_megs(self, id):
        """ Get amount of free space in a Volume Group. """
        vg = VolumeGroup.objects.get(id=id)
        return vg.megs - vg.usedmegs


class LvHandler(AbstractBlockVolumeHandler):
    model = LogicalVolume
    order = ("storageobj__name",)

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.lvm_info

    def merge(self, id):
        """ Merge the snapshot given by `id` back into the original volume. """
        LogicalVolume.objects.get(id=id).merge()


class LVMetadataHandler(ModelHandler):
    model = LVMetadata


class LVSnapshotJobHandler(ModelHandler):
    model = LVSnapshotJob


class VgProxy(ProxyModelHandler, VgHandler):
    def get_free_megs(self, id):
        """ Get amount of free space in a Volume Group. """
        return self._call_singlepeer_method("get_free_megs", id)

    def lvm_info(self, id):
        return self._call_singlepeer_method("lvm_info", id)

    def create(self, data):
        if "host" not in data:
            data["host"] = self._get_handler_instance(Host).current_id()
        return ModelHandler.create(self, data)


class LvProxy(ProxyModelHandler, LvHandler):
    model = LogicalVolume

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        return self._call_singlepeer_method("lvm_info", id)

    def create(self, data):
        if "id" in data:
            raise KeyError("Wai u ID")
        if "snapshot" in data and data["snapshot"] is not None:
            orig = LogicalVolume.all_objects.get(id=data["snapshot"]["id"])
            curr = orig.vg.host
        else:
            vg = VolumeGroup.all_objects.get(id=data["vg"]["id"])
            curr = vg.host
        if curr == Host.objects.get_current():
            return self.backing_handler.create(data)
        else:
            peer = PeerHost.objects.get(host=curr)
            try:
                return self._convert_datetimes(self._get_proxy_object(peer).create(data))
            except Fault, flt:
                raise translate_exception(flt)


class SnapshotConfHandler(ModelHandler):
    model = SnapshotConf

    def restore_config(self, conf_id):
        return SnapshotConf.objects.get(id=conf_id).restore_config()

    def process_config(self, config):
        return SnapshotConf.objects.process_config(config)


RPCD_HANDLERS = [
    DiskHandler,
    BlockDevicesHandler,
    VgProxy, LvProxy,
    LVMetadataHandler,
    LVSnapshotJobHandler,
    SnapshotConfHandler
    ]
