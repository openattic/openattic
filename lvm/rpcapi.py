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

from rpcd.handlers import BaseHandler, ModelHandler
from rpcd.handlers import ProxyModelHandler
from ifconfig.rpcapi import HostHandler

from lvm.models import VolumeGroup, LogicalVolume, ZfsSubvolume, ZfsSnapshot, LVMetadata
from lvm import blockdevices
from ifconfig.models import Host
from peering.models import PeerHost

from rpcd.exceptionhelper import translate_exception
from xmlrpclib import Fault


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

    def get_disk_stats(self, device):
        """ Get Kernel disk stats for a given device. """
        return blockdevices.get_disk_stats(device)

    def get_lvm_capabilities(self):
        return blockdevices.get_lvm_capabilities()

class VgHandler(ModelHandler):
    model = VolumeGroup
    order = ("name",)

    def join_device(self, id, device):
        """ Join the given device into this Volume Group. """
        if device.startswith("/dev"):
            raise ValueError("device must be given without leading /dev")
        vg = VolumeGroup.objects.get(id=id)
        return vg.join_device(device)

    def create(self, data):
        if "host" not in data:
            data["host"] = HostHandler(None, None).current_id()
        return ModelHandler.create(self, data)

    def get_free_megs(self, id):
        """ Get amount of free space in a Volume Group. """
        return VolumeGroup.objects.get(id=id).lvm_free_megs

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        vg = VolumeGroup.objects.get(id=id)
        return vg.lvm_info

class LvHandler(ModelHandler):
    model = LogicalVolume
    order = ("name",)

    def _override_get(self, obj, data):
        if obj.filesystem:
            data['fs'] = {
                'mountpoint':  obj.mountpoint,
                'mounted':     obj.mounted
                }
            if obj.mounted:
                data['fs']['stat'] = obj.stat
        else:
            data['fs'] = None
        return data

    def avail_fs(self):
        """ Return a list of available file systems. """
        from lvm.filesystems import FILESYSTEMS
        return [ {'name': fs.name, 'desc': fs.desc } for fs in FILESYSTEMS ]

    def get_shares(self, id):
        """ Return ID objects for shares that are configured for the given volume. """
        lv = LogicalVolume.objects.get(id=id)
        return [ ModelHandler._get_handler_for_model(sh.__class__)(self.user)._idobj(sh)
            for sh in lv.get_shares() ]

    def fs_info(self, id):
        """ Return detailed information about the given file system. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem:
            return lv.fs_info
        return {}

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.lvm_info

    def disk_stats(self, id):
        """ Return disk stats from the LV retrieved from the kernel. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.disk_stats

    def mount(self, id):
        """ Mount the given volume if it is not currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem and not lv.mounted:
            return lv.mount()
        return False

    def unmount(self, id):
        """ Unmount the given volume if it is currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem and lv.mounted:
            return lv.unmount()
        return False

    def is_mounted(self, id):
        """ Check if the given volume is currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.filesystem and lv.mounted

    def is_in_standby(self, id):
        """ Check if the given volume is currently in standby. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.standby


class LVMetadataHandler(ModelHandler):
    model = LVMetadata

class ZfsSubvolumeHandler(ModelHandler):
    model = ZfsSubvolume

class ZfsSnapshotHandler(ModelHandler):
    model = ZfsSnapshot

    def rollback(self, id):
        """ Rollback the volume to the snapshot given by `id`. """
        return ZfsSnapshot.objects.get(id=id).rollback()

class VgProxy(ProxyModelHandler, VgHandler):
    def get_free_megs(self, id):
        """ Get amount of free space in a Volume Group. """
        return self._call_singlepeer_method("get_free_megs", id)

    def lvm_info(self, id):
        return self._call_singlepeer_method("lvm_info", id)


class LvProxy(ProxyModelHandler, LvHandler):
    model = LogicalVolume

    def avail_fs(self):
        h = LvHandler(self.user)
        return h.avail_fs()

    def get_shares(self, id):
        return self._call_singlepeer_method("get_shares", id)

    def fs_info(self, id):
        """ Return detailed information about the given file system. """
        return self._call_singlepeer_method("fs_info", id)

    def lvm_info(self, id):
        """ Return information about the LV retrieved from LVM. """
        return self._call_singlepeer_method("lvm_info", id)

    def disk_stats(self, id):
        """ Return disk stats from the LV retrieved from the kernel. """
        return self._call_singlepeer_method("disk_stats", id)

    def mount(self, id):
        """ Mount the given volume if it is not currently mounted. """
        return self._call_singlepeer_method("mount", id)

    def unmount(self, id):
        """ Unmount the given volume if it is currently mounted. """
        return self._call_singlepeer_method("unmount", id)

    def is_mounted(self, id):
        """ Check if the given volume is currently mounted. """
        return self._call_singlepeer_method("is_mounted", id)

    def is_in_standby(self, id):
        """ Check if the given volume is currently in standby. """
        return self._call_singlepeer_method("is_in_standby", id)

    def create(self, data):
        if "id" in data:
            raise KeyError("Wai u ID")
        if "snapshot" in data and data["snapshot"] is not None:
            orig = LogicalVolume.all_objects.get( id=data["snapshot"]["id"] )
            curr = orig.vg.host
        else:
            vg   = VolumeGroup.all_objects.get( id=data["vg"]["id"] )
            curr = vg.host
        if curr == Host.objects.get_current():
            return self.backing_handler.create(data)
        else:
            peer = PeerHost.objects.get(name=curr.name)
            try:
                return self._convert_datetimes( self._get_proxy_object(peer).create(data) )
            except Fault, flt:
                raise translate_exception(flt)

class ZfsSubvolumeProxy(ProxyModelHandler, ZfsSubvolumeHandler):
    model = ZfsSubvolume

class ZfsSnapshotProxy(ProxyModelHandler, ZfsSnapshotHandler):
    model = ZfsSnapshot



RPCD_HANDLERS = [BlockDevicesHandler, VgProxy, LvProxy, ZfsSubvolumeProxy, ZfsSnapshotProxy, LVMetadataHandler]
