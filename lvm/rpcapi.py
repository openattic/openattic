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

from rpcd.handlers import ModelHandler

from lvm.models import VolumeGroup, LogicalVolume, ZfsSubvolume, ZfsSnapshot, LVMetadata

class VgHandler(ModelHandler):
    model = VolumeGroup
    order = ("name",)

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

    def join_device(self, id, device):
        """ Join the given device into this Volume Group. """
        if device.startswith("/dev"):
            raise ValueError("device must be given without leading /dev")
        vg = VolumeGroup.objects.get(id=id)
        return vg.join_device(device)

    def active(self):
        """ Return all active objects. """
        return [ self._getobj(obj) for obj in self.model.objects.active().order_by(*self.order) ]

    def get_free_megs(self, id):
        """ Get amount of free space in a Volume Group. """
        return VolumeGroup.objects.get(id=id).lvm_free_megs

    def get_mounts(self):
        """ Get currently mounted devices. """
        return VolumeGroup.get_mounts()

    def get_devices(self):
        """ Get all existing devices. """
        return VolumeGroup.get_devices()

    def is_device_in_use(self, device):
        """ Check if the given device is in use either as a PV, or by being mounted. """
        if device.startswith("/dev"):
            raise ValueError("device must be given without leading /dev")
        return VolumeGroup.is_device_in_use(device)

    def get_partitions(self, device):
        """ Get all partitions from a given device. """
        return VolumeGroup.get_partitions(device)

    def get_disk_stats(self, device):
        """ Get Kernel disk stats for a given device. """
        return VolumeGroup.get_disk_stats(device)

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
                'mountpoints': obj.fs.mountpoints,
                'mounted':     obj.mounted
                }
            if obj.mounted:
                data['fs']['stat'] = obj.fs.stat
        else:
            data['fs'] = None
        return data

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

    def active(self):
        """ Return all active objects. """
        return [ self._getobj(obj) for obj in self.model.objects.active().order_by(*self.order) ]

    def get_capabilities(self):
        return LogicalVolume.get_capabilities()

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

    def mount_all(self):
        """ Mount all volumes which are not currently mounted. """
        return LogicalVolume.mount_all()

    def mount(self, id):
        """ Mount the given volume if it is not currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem and not lv.mounted:
            return lv.mount()
        return False

    def unmount_all(self):
        """ Unmount all volumes which are currently mounted. """
        return LogicalVolume.unmount_all()

    def mounted_volumes(self):
        """ Return IDs of currently mounted volumes. """
        return [ self._idobj(lv) for lv in LogicalVolume.mounted_volumes() ]

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

RPCD_HANDLERS = [VgHandler, LvHandler, ZfsSubvolumeHandler, ZfsSnapshotHandler, LVMetadataHandler]
