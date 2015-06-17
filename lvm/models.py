# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

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
import os
import os.path
import datetime

from django.contrib.auth.models import User
from django.db import models
from django.core.cache import get_cache
from django.utils.translation   import ugettext_noop as _

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from systemd.helpers import get_dbus_object, dbus_to_python
from lvm             import signals as lvm_signals
from cron.models     import Cronjob
from lvm             import snapcore

from volumes.blockdevices import UnsupportedRAID
from volumes.filesystems import FileSystem, FILESYSTEMS
from volumes.models  import VolumePool, BlockVolume
from volumes         import capabilities

def validate_vg_name(value):
    from django.core.exceptions import ValidationError
    if value in ('.', '..'):
        raise ValidationError(_("VG names may not be '.' or '..'."))
    if value[0] == '-':
        raise ValidationError(_("VG names must not begin with a hyphen."))
    if os.path.exists( os.path.join("/dev", value) ):
        raise ValidationError(_("This name clashes with a file or directory in /dev."))
    if re.findall("[^a-zA-Z0-9+_.-]", value):
        raise ValidationError(_("The following characters are valid for VG and LV names: a-z A-Z 0-9 + _ . -"))

def validate_lv_name(value):
    # see http://linux.die.net/man/8/lvm -> "Valid Names"
    from django.core.exceptions import ValidationError
    if value in ('.', '..'):
        raise ValidationError(_("LV names may not be '.' or '..'."))
    if value[0] == '-':
        raise ValidationError(_("LV names must not begin with a hyphen."))
    if re.findall("[^a-zA-Z0-9+_.-]", value):
        raise ValidationError(_("The following characters are valid for VG and LV names: a-z A-Z 0-9 + _ . -"))
    if value.startswith("snapshot") or value.startswith("pvmove"):
        raise ValidationError(_("The volume name must not begin with 'snapshot' or 'pvmove'."))
    if "_mlog" in value or "_mimage" in value:
        raise ValidationError(_("The volume name must not contain '_mlog' or '_mimage'."))



class VolumeGroup(VolumePool):
    """ Represents a LVM Volume Group. """

    host        = models.ForeignKey(Host, null=True)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def __init__( self, *args, **kwargs ):
        VolumePool.__init__( self, *args, **kwargs )
        self._lvm_info = None

    def __unicode__(self):
        return self.storageobj.name

    def full_clean(self, exclude=None, validate_unique=True):
        validate_vg_name(self.storageobj.name)
        VolumePool.full_clean(self, exclude=exclude, validate_unique=validate_unique)

    def save( self, *args, **kwargs ):
        VolumePool.save(self, *args, **kwargs)
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    def delete(self):
        lvm = get_dbus_object("/lvm")
        for lv in LogicalVolume.objects.filter(vg=self):
            lv.delete()
        pvs = lvm.pvs()
        lvm.vgremove(self.storageobj.name)
        if pvs:
            for device in pvs:
                if pvs[device]["LVM2_VG_NAME"] == self.storageobj.name:
                    lvm.pvremove(device)
        VolumePool.delete(self)
        get_cache("systemd").delete_many(["/sbin/lvs", "/sbin/vgs", "/sbin/pvs"])

    @property
    def lvm_info(self):
        """ VG information from LVM. """
        if self._lvm_info is None:
            self._lvm_info = dbus_to_python(get_dbus_object("/lvm").vgs())[self.storageobj.name]
        return self._lvm_info

    @property
    def attributes(self):
        attr = self.lvm_info["LVM2_VG_ATTR"].lower()
        # vg_attr bits according to ``man vgs'':
        # 0  Permissions: (w)riteable, (r)ead-only
        # 1  Resi(z)eable
        # 2  E(x)ported
        # 3  (p)artial: one or more physical volumes belonging to the volume group are missing from the system
        # 4  Allocation policy: (c)ontiguous, c(l)ing, (n)ormal, (a)nywhere, (i)nherited
        # 5  (c)lustered
        # flags are returned in a way that in most normal cases, the status string is as short as possible.
        flags = [
            {"w": None, "r": _("read-only")}[        attr[0] ],
            {"z": None, "-": _("non-resizable")}[    attr[1] ],
            {"x": _("exported"), "-": None}[         attr[2] ],
            {"p": _("partial"), "-": _("online")}[   attr[3] ],
            {"c": _("contiguous allocation"),
             "l": _("cling allocation"),
             "n": None,
             "a": _("anywhere allocation"),
             "i": _("inherited allocation")}[        attr[4] ],
            {"c": _("clustered"), "-": None}[        attr[5] ],
        ]
        return ", ".join([flag for flag in flags if flag is not None])

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        attr = self.lvm_info["LVM2_VG_ATTR"].lower()
        stat = "failed"
        if attr[0] == "w": stat = "online"
        if attr[0] == "r": stat = "readonly"
        return stat

    def get_status(self):
        attr = self.lvm_info["LVM2_VG_ATTR"].lower()
        if attr[0] == "w": return ["online"]
        if attr[0] == "r": return ["readonly"]

    @property
    def usedmegs(self):
        return float(self.lvm_info["LVM2_VG_SIZE"]) - float(self.lvm_info["LVM2_VG_FREE"])

    @classmethod
    def create_volumepool(cls, blockvolumes, options):
        return None

    def _create_volume_for_storageobject(self, storageobj, options):
        lv = LogicalVolume(vg=self, storageobj=storageobj)
        lv.full_clean()
        lv.save()
        return lv

    def is_fs_supported(self, filesystem):
        return True

    def get_volumepool_usage(self, stats):
        stats["vp_megs"] = float(self.lvm_info["LVM2_VG_SIZE"])
        stats["vp_free"] = float(self.lvm_info["LVM2_VG_FREE"])
        stats["vp_used"] = stats["vp_megs"] - stats["vp_free"]
        stats["vp_max_new_fsv"] = stats["vp_free"]
        stats["vp_max_new_bv"]  = stats["vp_free"]
        stats["used"]  = max(stats.get("used", None),         stats["vp_used"])
        stats["free"]  = min(stats.get("free", float("inf")), stats["vp_free"])
        return stats


class LogicalVolume(BlockVolume):
    """ Represents a LVM Logical Volume and offers management functions.

        This is the main class of openATTIC's design.
    """

    vg          = models.ForeignKey(VolumeGroup, blank=True)
    snapshot    = models.ForeignKey("self", blank=True, null=True, related_name="snapshot_set")
    snapshotconf= models.ForeignKey("SnapshotConf", blank=True, null=True, related_name="snapshot_set")

    objects = getHostDependentManagerClass("vg__host")()
    all_objects = models.Manager()

    class NotASnapshot(Exception):
        pass

    def __init__( self, *args, **kwargs ):
        BlockVolume.__init__( self, *args, **kwargs )
        self._sysd = None
        self._lvm = None
        self._lvm_info = None
        self._fs = None

    def __unicode__(self):
        return self.storageobj.name

    def validate_unique(self, exclude=None):
        qry = LogicalVolume.objects.filter(storageobj__name=self.storageobj.name)
        if self.id is not None:
            qry = qry.exclude(id=self.id)
        if qry.count() > 0:
            from django.core.exceptions import ValidationError
            raise ValidationError({"name": ["A Volume named '%s' already exists on this host." % self.storageobj.name]})
        BlockVolume.validate_unique(self, exclude=exclude)

    def full_clean(self, exclude=None, validate_unique=True):
        validate_lv_name(self.storageobj.name)
        BlockVolume.full_clean(self, exclude=exclude, validate_unique=validate_unique)
        if self.id is None:
            self.uuid = '-'
        currmegs = 0
        if self.id is not None:
            currmegs = self.lvm_megs
        if float(self.vg.lvm_info["LVM2_VG_FREE"]) < int(self.storageobj.megs) - currmegs:
            from django.core.exceptions import ValidationError
            raise ValidationError({"megs": ["Volume Group %s has insufficient free space." % self.vg.storageobj.name]})

    @property
    def lvm(self):
        if self._lvm is None:
            self._lvm = get_dbus_object("/lvm")
        return self._lvm

    @property
    def attributes(self):
        try:
            attr = self.lvm_info["LVM2_LV_ATTR"].lower()
        except KeyError:
            return "unknown"
        # lv_attr bits: see ``man lvs''
        # flags are returned in a way that in most normal cases, the status string is as short as possible.
        flags = [
            {
                "m": _("mirrored"),       "M": _("mirrored without initial sync"),
                "o": _("origin"),         "O": _("merging origin"),
                "r": _("RAID"),           "R": _("RAID without initial sync"),
                "s": _("snapshot"),       "S": _("merging snapshot"),
                "p": _("pvmove"),         "v": _("virtual"),
                "i": _("image"),          "I": _("out-of-sync image"),
                "l": _("mirror log"),     "c": _("conversion"),
                "V": _("thin volume"),    "t": _("thin pool"),
                "T": _("thin pool data"), "e": _("RAID/thin pool metadata"),
                '-': None
            }[ attr[0] ],
            {"w": None, "r": _("read-only"), "R": _("temporarily read-only")}[ attr[1] ],
            {
                "a": _("anywhere"),       "c": _("contiguous allocation"),
                "i": None,                "l": _("cling allocation"),
                "n": _("normal allocation")
            }[ attr[2].lower() ],
            {"m": "fixed minor", "-": None}[ attr[3] ],
            {
                "a": _("active"),
                "s": _("suspended"),
                "I": _("invalid snapshot"),
                "S": _("invalid suspended snapshot"),
                "m": _("snapshot merge failed"),
                "M": _("suspended snapshot merge failed"),
                "d": _("mapped device present without tables"),
                "i": _("mapped device present with inactive table"),
                "-": _("offline")
            }[ attr[4] ],
            {"o": _("open"), "-": None}[ attr[5] ],
            {
                "m": _("mirror"),    "r": _("raid"),
                "s": _("snapshot"),  "t": _("thin"),
                "u": _("unknown"),   "v": _("virtual"),
                "-": None
            }[ attr[6] ],
            {"z": _("zeroed"),  "-": None}[ attr[7] ],
            #{"p": "partial", "-": None}[ attr[8] ],
        ]
        if attr[2] in ("A", "C", "I", "L", "N"):
            flags.append(_("pvmove in progress"))
        return ", ".join([flag for flag in flags if flag is not None])

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        try:
            attr = self.lvm_info["LVM2_LV_ATTR"].lower()
        except KeyError:
            return "unknown"
        stat = "failed"
        if attr[4] == "a": stat = "online"
        if attr[4] == "-": stat = "offline"
        if attr[0] == "O": stat = "restoring_snapshot"
        if attr[1] == "r": stat = "readonly"
        return stat

    def get_status(self):
        flags = self.vg.get_status()
        try:
            attr = self.lvm_info["LVM2_LV_ATTR"].lower()
        except KeyError:
            flags.append("unknown")
        else:
            if attr[4] == "a": flags.append("online"    )
            if attr[4] == "-": flags.append("offline"   )
            if attr[0] == "O": flags.append("rebuilding")
            if attr[1] == "r": flags.append("readonly"  )
        return flags

    @property
    def path(self):
        """ The actual device under which this LV operates. """
        return os.path.join( "/dev", self.vg.storageobj.name, self.storageobj.name )

    @property
    def host(self):
        return self.vg.host

    @property
    def dmdevice( self ):
        """ Returns the dm-X device that represents this LV. """
        return os.path.realpath( self.path )

    @property
    def raid_params(self):
        if self.vg.member_set.all().count() != 0:
            return self.vg.member_set.all()[0].blockvolume.volume.raid_params
        raise UnsupportedRAID()

    @property
    def fs(self):
        """ An instance of the filesystem handler class for this LV (if any). """
        if self._fs is None:
            for fsclass in FILESYSTEMS:
                try:
                    self._fs = fsclass(self)
                    break
                except FileSystem.WrongFS:
                    pass
        return self._fs

    @property
    def lvm_info(self):
        """ LV information from LVM. """
        if self._lvm_info is None:
            self._lvm_info = dbus_to_python(self.lvm.lvs())[self.storageobj.name]
        return self._lvm_info

    @property
    def lvm_megs(self):
        """ The actual size of this LV in Megs, retrieved from LVM. """
        return float(self.lvm_info["LVM2_LV_SIZE"][:-1])

    def _create_snapshot_for_storageobject(self, storageobj, options):
        snap_lv = LogicalVolume(storageobj=storageobj, vg=self.vg, snapshot=self)
        snap_lv.full_clean()
        snap_lv.save()
        return snap_lv

    ##########################
    ### PROCESSING METHODS ###
    ##########################

    def do_snapshot(self, name, megs=None, snapshotconf=None):
        snap = LogicalVolume(snapshot=self)
        snap.name = name
        snap.megs = (megs or self.megs * 0.2)
        snap.snapshotconf = snapshotconf
        snap.save()
        return snap

    def install(self):
        lvm_signals.pre_install.send(sender=LogicalVolume, instance=self)
        if self.snapshot:
            snap = self.snapshot.path
        else:
            snap = ""
        self.lvm.lvcreate( self.vg.storageobj.name, self.storageobj.name, self.storageobj.megs, snap )
        if not self.snapshot:
            self.lvm.lvchange( self.path, True )
        lvm_signals.post_install.send(sender=LogicalVolume, instance=self)

    def uninstall(self):
        lvm_signals.pre_uninstall.send(sender=LogicalVolume, instance=self)
        if not self.snapshot:
            self.lvm.lvchange(self.path, False)
        self.lvm.lvremove(self.path)
        lvm_signals.post_uninstall.send(sender=LogicalVolume, instance=self)

    def shrink( self, oldmegs, newmegs ):
        lvm_signals.pre_shrink.send(sender=LogicalVolume, instance=self)
        self.lvm.lvresize(self.path, newmegs, False)
        lvm_signals.post_shrink.send(sender=LogicalVolume, instance=self)
        self._lvm_info = None # outdate cached information

    def grow( self, oldmegs, newmegs ):
        lvm_signals.pre_grow.send(sender=LogicalVolume, instance=self)
        self.lvm.lvresize(self.path, newmegs, True)
        lvm_signals.post_grow.send(sender=LogicalVolume, instance=self)
        self._lvm_info = None # outdate cached information

    def clean(self):
        if not self.snapshot:
            from django.core.exceptions import ValidationError
            if not self.vg:
                raise ValidationError(_('The vg field is required unless you are creating a snapshot.'))
        elif self.snapshot.snapshot:
            raise ValidationError(_('LVM does not support snapshotting snapshots.'))

    def save( self, database_only=False, *args, **kwargs ):
        if database_only:
            return BlockVolume.save(self, *args, **kwargs)

        install = (self.id is None)

        if self.id is not None:
            old_self = LogicalVolume.objects.get(id=self.id)

        ret = BlockVolume.save(self, *args, **kwargs)

        if install:
            self.install()
            ret = BlockVolume.save(self, *args, **kwargs)

        return ret

    def delete(self):
        BlockVolume.delete(self)
        self.uninstall()

    def merge(self):
        if self.snapshot is None:
            raise LogicalVolume.NotASnapshot(self.storageobj.name)
        orig = self.snapshot
        orig.unmount()
        for snapshot in orig.snapshot_set.all():
            snapshot.unmount()
        self.lvm.lvmerge(  self.path )
        BlockVolume.delete(self)
        for snapshot in orig.snapshot_set.all():
            snapshot.mount()
        orig.mount()

    def get_volume_usage(self, stats):
        """ Get volume usage statistics, taking snapshot usage in account.

            If we're writing into the origin volume,
                the origin's   "used"  increases
                the origin's   "free"  decreases
                the snapshot's "steal" increases

            if we're writing into the snapshot volume,
                the snapshot's "used"  increases
                the snapshot's "free"  decreases
                the origin's   "steal" increases

            if we're an origin:
                used  = unknown
                free  = unknown
                steal = size - the least amount of free space in a snapshot

            if we're a snapshot:
                used  = megs * LVM2_DATA_PERCENT / 100
                free  = megs - used
                steal = 0

        """

        stats["bd_megs"] = self.storageobj.megs
        stats.setdefault("used", None)
        stats.setdefault("free", float("inf"))

        if self.storageobj.snapshot is not None:
            # Are we a snapshot? If so, add block device usage info.
            stats["bd_used"] = self.storageobj.megs * float(self.lvm_info["LVM2_DATA_PERCENT"]) / 100.
            stats["bd_free"] = stats["bd_megs"] - stats["bd_used"]

            stats["steal"] = self.storageobj.megs - stats["bd_free"] - stats["bd_used"]
            stats["used"]  = max(stats["used"], stats["bd_used"])
            stats["free"]  = min(stats["free"], stats["bd_free"])

        else:
            # Are we a snapshotted origin? If so, we can only write data until the
            # snapshot that has the least free space left is full, so the other space
            # is stolen from us by the snapshots.

            snap_free_space  = float("inf")
            snap_used_space  = None
            snap_used_create = None

            # Find the snapshot with the least space left
            for snapshot_so in self.storageobj.snapshot_storageobject_set.all():
                snapstats = snapshot_so.get_volume_usage()
                if "free" in snapstats and snapstats["free"] < snap_free_space:
                    snap_free_space  = snapstats["free"]
                    snap_used_space  = snapstats["used"]
                    snap_used_create = snapstats["used"] # TODO: use snapshot_so.usedmegs_at_create

            # This snapshot steals everything from us except for the space that is
            # usable in the snapshot as well.
            if snap_free_space is not None and snap_used_space is not None:
                stats["steal"] = self.storageobj.megs - snap_free_space - snap_used_create
                stats["used"]  = max(stats["used"], snap_used_space)
                stats["free"]  = min(stats["free"], snap_free_space)

        return stats

class VolumeGroupDevice(capabilities.Device):
    model = VolumeGroup
    requires = [
        capabilities.BlockbasedCapability,
        capabilities.FailureToleranceCapability,
        ]
    provides = [
        capabilities.SubvolumesCapability,
        capabilities.SubvolumeSnapshotCapability,
        ]

class LogicalVolumeDevice(capabilities.Device):
    model = LogicalVolume
    requires = VolumeGroupDevice
    provides = [
        capabilities.GrowCapability,
        capabilities.ShrinkCapability,
        ]
    removes  = [
        capabilities.SubvolumesCapability,
        capabilities.SubvolumeSnapshotCapability,
        ]



class LVMetadata(models.Model):
    """ Stores arbitrary metadata for a volume. This can be anything you like,
        and it is indended to be used by third party programs.
    """
    volume  = models.ForeignKey(LogicalVolume)
    key     = models.CharField(max_length=255)
    value   = models.CharField(max_length=255)

    objects = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()


class LVSnapshotJob(Cronjob):
    """ Scheduled snapshots. """
    start_time  = models.DateTimeField(null=True, blank=True)
    end_time    = models.DateTimeField(null=True, blank=True)
    is_active   = models.BooleanField(default=False)
    conf        = models.ForeignKey('SnapshotConf')

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def full_clean(self, exclude=None, validate_unique=True):
        return #lol

    def dosnapshot(self):
        now = datetime.datetime.now()

        execute_now = True

        if self.start_time > now:
            execute_now = False

        if self.end_time:
            if self.end_time < now:
                execute_now = False

        if execute_now:
            snapcore.process_config(self.conf.restore_config(), self.conf)
            self.conf.last_execution = now
            self.conf.save()

    def save(self, *args, **kwargs):
        for path in ["/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin"]:
            if os.path.exists(os.path.join(path, "oaconfig")):
                self.command = "echo Doing snapshot!"
                Cronjob.save(self, *args, **kwargs)
                self.command = str(path) + "/oaconfig dosnapshot -j " + str(self.id)
                return Cronjob.save(self, *args, **kwargs)
        raise SystemError("oaconfig not found")

class ConfManager(models.Manager):
    def process_config(self, conf_obj):
        if conf_obj["data"]["scheduling_select"] is not None:
            if conf_obj["data"]["scheduling_select"] == "execute_now":
                snapcore.process_config(conf_obj, None)
            else:
                self.add_config(conf_obj)
        else:
            raise KeyError("scheduling informations not found in config dictionary")

    def add_config(self, conf_obj):
        data = conf_obj["data"]
        snapconf = SnapshotConf(confname=data["configname"], prescript=data["prescript"], postscript=data["postscript"], retention_time=data["retention_time"], last_execution=None)
        snapconf.save()

        time_configs = {'h': [], 'moy': [], 'dow': []}
        startdate = enddate = minute = day_of_month = ''

        # if the job should only run once
        if data['executedate'] is not None:
            startdate = enddate = datetime.datetime.strptime(data['executedate'], '%Y-%m-%dT%H:%M:%S')
            enddate = enddate + datetime.timedelta(minutes=1)

            time_configs['h'] = [str(startdate.hour)]
            time_configs['dow'] = [str(startdate.isoweekday() % 7)]
            time_configs['moy'] = [str(startdate.month)]
            minute = startdate.minute
            day_of_month = startdate.day
        # if it's a 'real' job
        else:
            startdate = data["startdate"]
            enddate = data["enddate"]

            for key, value in data.items():
                if (key.startswith('h_') or key.startswith('moy_') or key.startswith('dow_')) and value == 'on':
                    time, number = key.split('_')
                    time_configs[time].append(number)
            # sort values
            for time, numbers in time_configs.items():
                if len(numbers) > 0:
                    numbers.sort(key=int)

            minute = data['minute'] if 'minute' in data else ''
            day_of_month = data['day_of_month'] if 'day_of_month' in data else ''

        jobconf = LVSnapshotJob(
            start_time=startdate,
            end_time=enddate,
            is_active=data["is_active"],
            conf=snapconf,
            host=Host.objects.get_current(),
            user="root",
            minute=minute,
            hour=','.join(time_configs["h"]),
            domonth=day_of_month,
            month=','.join(time_configs["moy"]),
            doweek=','.join(time_configs["dow"]))
        jobconf.save()

        for plugin_name, plugin in snapcore.PluginLibrary.plugins.items():
            if plugin_name in conf_obj["plugin_data"]:
                # call save config function
                plugin_inst = plugin()
                plugin_inst.save_config(conf_obj["plugin_data"][plugin_name], snapconf)

        volumes = conf_obj["volumes"]
        for volume in volumes:
            logical_volume = LogicalVolume.all_objects.get(id=volume)
            volume_conf = LogicalVolumeConf(snapshot_conf=snapconf, volume=logical_volume, snapshot_space=20)
            volume_conf.save()

        return snapconf

class SnapshotConf(models.Model):
    confname        = models.CharField(null=True, max_length=255)
    prescript       = models.CharField(null=True, max_length=255)
    postscript      = models.CharField(null=True, max_length=225)
    retention_time  = models.IntegerField(null=True, blank=True)
    last_execution  = models.DateTimeField(null=True, blank=True)

    objects = ConfManager()

    def restore_config(self):
        conf_obj                            = {}
        conf_obj['data']                    = {}
        conf_obj['data']['configname']      = self.confname
        conf_obj['data']['prescript']       = self.prescript
        conf_obj['data']['postscript']      = self.postscript
        conf_obj['data']['retention_time']  = self.retention_time
        conf_obj['volumes']                 = list(LogicalVolumeConf.objects.filter(snapshot_conf_id=self.id).values_list('volume_id', flat=True))

        job = LVSnapshotJob.objects.get(conf_id=self.id)
        if job:
            conf_obj['data']['is_active']     = job.is_active
            conf_obj['data']['day_of_month']  = str(job.domonth)
            conf_obj['data']['minute']        = str(job.minute)
            conf_obj['data']['startdate']     = job.start_time
            conf_obj['data']['enddate']       = job.end_time

            dow = job.doweek.split(',')
            for i in dow:
                conf_obj['data']['dow_' + i.strip()] = 'on'

            hour = job.hour.split(',')
            for i in hour:
                conf_obj['data']['h_' + i.strip()] = 'on'

            moy = job.month.split(',')
            for i in moy:
                conf_obj['data']['moy_' + i.strip()] = 'on'

        # restore plugin data
        conf_obj["plugin_data"] = {}
        for plugin_name, plugin in snapcore.PluginLibrary.plugins.items():
            plugin_inst = plugin()
            conf_obj["plugin_data"].update(plugin_inst.restore_config(self))

        return conf_obj

class LogicalVolumeConf(models.Model):
    snapshot_conf   = models.ForeignKey(SnapshotConf)
    volume          = models.ForeignKey(LogicalVolume)
    snapshot_space  = models.IntegerField(null=True, blank=True)
