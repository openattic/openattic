# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from lvm.models import VolumeGroup, LogicalVolume

class VgHandler(BaseHandler):
    model = VolumeGroup

    def get_mounts(self):
        return VolumeGroup.get_mounts()

    def get_devices(self):
        return VolumeGroup.get_devices()

    def get_partitions(self, device):
        return VolumeGroup.get_partitions(device)

    def get_disk_stats(self, device):
        return VolumeGroup.get_disk_stats(device)

class LvHandler(BaseHandler):
    model = LogicalVolume

    def _override_get(self, obj, data):
        if obj.filesystem:
            data['fs'] = {
                'mountpoints': obj.fs.mountpoints,
                'mounted':     obj.fs.mounted
                }
            if obj.fs.mounted:
                data['fs']['stat'] = obj.fs.stat
        else:
            data['fs'] = None
        return data

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'name': obj.name}

    def avail_fs(self):
        """ Return a list of available file systems. """
        from lvm.filesystems import FILESYSTEMS
        return [ {'name': fs.name, 'desc': fs.desc } for fs in FILESYSTEMS ]

    def fs_info(self, id):
        """ Return detailed information about the given file system. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem:
            return lv.fs.info
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
        ret = []
        for lv in LogicalVolume.objects.all():
            if lv.filesystem and not lv.fs.mounted:
                succ = lv.fs.mount()
                lvid = self._idobj(lv)
                lvid["success"] = succ
                ret.append(lvid)
        return ret

    def mount(self, id):
        """ Mount the given volume if it is not currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem and not lv.fs.mounted:
            return lv.fs.mount()
        return False

    def unmount_all(self):
        """ Unmount all volumes which are currently mounted. """
        ret = []
        for lv in LogicalVolume.objects.all():
            if lv.filesystem and lv.fs.mounted:
                succ = lv.fs.unmount()
                lvid = self._idobj(lv)
                lvid["success"] = succ
                ret.append(lvid)
        return ret

    def unmount(self, id):
        """ Unmount the given volume if it is currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        if lv.filesystem and lv.fs.mounted:
            return lv.fs.unmount()
        return False

    def is_mounted(self, id):
        """ Check if the given volume is currently mounted. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.filesystem and lv.fs.mounted

    def is_in_standby(self, id):
        """ Check if the given volume is currently in standby. """
        lv = LogicalVolume.objects.get(id=id)
        return lv.standby

RPCD_HANDLERS = [VgHandler, LvHandler]
