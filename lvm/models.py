# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

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

import pyudev
import dbus
import re
import os
import os.path
import datetime
import shlex

from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from django.utils.translation   import ugettext_lazy as _

from systemd         import invoke
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from systemd.helpers import dbus_to_python
from lvm             import signals as lvm_signals
from lvm             import blockdevices
from lvm.conf        import settings as lvm_settings
from cron.models     import Cronjob
from lvm             import snapcore

from volumes.filesystems import FileSystem, FILESYSTEMS
from volumes.models  import VolumePool, BlockVolume, FileSystemVolume
from volumes         import capabilities

def validate_vg_name(value):
    from django.core.exceptions import ValidationError
    if value in ('.', '..'):
        raise ValidationError("VG names may not be '.' or '..'.")
    if value[0] == '-':
        raise ValidationError("VG names must not begin with a hyphen.")
    if os.path.exists( os.path.join("/dev", value) ):
        raise ValidationError("'%s' exists as a device file, cannot use it as VG name" % value)
    if re.findall("[^a-zA-Z0-9+_.-]", value):
        raise ValidationError("The following characters are valid for VG and LV names: a-z A-Z 0-9 + _ . -")

def validate_lv_name(value):
    # see http://linux.die.net/man/8/lvm -> "Valid Names"
    from django.core.exceptions import ValidationError
    if value in ('.', '..'):
        raise ValidationError("LV names may not be '.' or '..'.")
    if value[0] == '-':
        raise ValidationError("LV names must not begin with a hyphen.")
    if re.findall("[^a-zA-Z0-9+_.-]", value):
        raise ValidationError("The following characters are valid for VG and LV names: a-z A-Z 0-9 + _ . -")
    if value.startswith("snapshot") or value.startswith("pvmove"):
        raise ValidationError("The volume name must not begin with 'snapshot' or 'pvmove'.")
    if "_mlog" in value or "_mimage" in value:
        raise ValidationError("The volume name must not contain '_mlog' or '_mimage'.")



class VolumeGroup(VolumePool):
    """ Represents a LVM Volume Group. """

    name        = models.CharField(max_length=130, unique=True, validators=[validate_vg_name])
    host        = models.ForeignKey(Host, null=True)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def __init__( self, *args, **kwargs ):
        VolumePool.__init__( self, *args, **kwargs )
        self._lvm_info = None

    def __unicode__(self):
        return self.name

    def join_device(self, device):
        """ Reformat a device as a Physical Volume and add it to this Volume Group. """
        if blockdevices.is_device_in_use(device):
            raise ValueError( "Device '%s' is in use, won't touch it." % device )
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        return lvm.join_device_to_vg(device, self.name)

    def get_pvs(self):
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        devs = []
        for pvpath, pvinfo in lvm.pvs().items():
            if pvinfo["LVM2_VG_NAME"] == self.name:
                devs.append(pvinfo)
        return devs

    def get_base_device_info(self):
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        devs = {}
        ctx = pyudev.Context()

        def checkmd(devnode):
            dev = pyudev.Device.from_name(ctx, "block", devnode)
            if "MD_LEVEL" in dev.keys() and "ID_TYPE" not in dev.keys():
                for subdev in os.listdir(os.path.join("/sys/class/block", devnode, "slaves")):
                    checkmd(subdev)
            else:
                devs[devnode] = dict( dev.items() )

        for pvpath, pvinfo in lvm.pvs().items():
            if pvinfo["LVM2_VG_NAME"] == self.name:
                devnode = os.path.split(pvpath)[-1]
                checkmd(devnode)

        return devs

    def save( self, *args, **kwargs ):
        VolumePool.save(self, *args, **kwargs)
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm").invalidate()

    def delete(self):
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        for lv in LogicalVolume.objects.filter(vg=self):
            lv.delete()
        pvs = lvm.pvs()
        lvm.vgremove(self.name)
        if pvs:
            for device in pvs:
                if pvs[device]["LVM2_VG_NAME"] == self.name:
                    lvm.pvremove(device)
        VolumePool.delete(self)

    @property
    def lvm_info(self):
        """ VG information from LVM. """
        if self._lvm_info is None:
            lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
            self._lvm_info = dbus_to_python(lvm.vgs())[self.name]
        return self._lvm_info

    @property
    def lvm_free_megs(self):
        return float( self.lvm_info["LVM2_VG_FREE"] )

    @property
    def status(self):
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
            {"w": None, "r": "read-only"}[        attr[0] ],
            {"z": None, "-": "non-resizable"}[    attr[1] ],
            {"x": "exported", "-": None}[         attr[2] ],
            {"p": "partial", "-": "online"}[      attr[3] ],
            {"c": "contiguous allocation",
             "l": "cling allocation",
             "n": None,
             "a": "anywhere allocation",
             "i": "inherited allocation"}[        attr[4] ],
            {"c": "clustered", "-": None}[        attr[5] ],
        ]
        return ", ".join([flag for flag in flags if flag is not None])

    @property
    def megs(self):
        return float(self.lvm_info["LVM2_VG_SIZE"])

    @property
    def usedmegs(self):
        return float(self.lvm_info["LVM2_VG_SIZE"]) - float(self.lvm_info["LVM2_VG_FREE"])

    @property
    def type(self):
        return "Volume Group"


class LogicalVolume(BlockVolume):
    """ Represents a LVM Logical Volume and offers management functions.

        This is the main class of openATTIC's design.
    """

    name        = models.CharField(max_length=130, validators=[validate_lv_name])
    megs        = models.IntegerField(_("Size in MB"))
    vg          = models.ForeignKey(VolumeGroup, blank=True)
    snapshot    = models.ForeignKey("self", blank=True, null=True, related_name="snapshot_set")
    filesystem  = models.CharField(max_length=20, blank=True, choices=[(__fs.name, __fs.desc) for __fs in FILESYSTEMS] )
    formatted   = models.BooleanField(default=False, editable=False)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )
    uuid        = models.CharField(max_length=38, blank=True, editable=False)
    dedup       = models.BooleanField(_("Deduplication"), blank=True, default=False)
    compression = models.BooleanField(_("Compression"), blank=True, default=False)
    createdate  = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    snapshotconf= models.ForeignKey("SnapshotConf", blank=True, null=True, related_name="snapshot_set")

    type        = "lv"

    objects = getHostDependentManagerClass("vg__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = ("vg", "name")

    class NotASnapshot(Exception):
        pass

    def __init__( self, *args, **kwargs ):
        BlockVolume.__init__( self, *args, **kwargs )
        self._sysd = None
        self._lvm = None
        self._lvm_info = None
        self._fs = None
        self._jid = None

    def __unicode__(self):
        return self.name

    def validate_unique(self, exclude=None):
        qry = LogicalVolume.objects.filter(name=self.name)
        if self.id is not None:
            qry = qry.exclude(id=self.id)
        if qry.count() > 0:
            from django.core.exceptions import ValidationError
            raise ValidationError({"name": ["A Volume named '%s' already exists on this host." % self.name]})
        BlockVolume.validate_unique(self, exclude=exclude)

    def full_clean(self):
        if float(self.vg.lvm_info["LVM2_VG_FREE"]) < int(self.megs):
            from django.core.exceptions import ValidationError
            raise ValidationError({"megs": ["Volume Group %s has insufficient free space." % self.vg.name]})
        return BlockVolume.full_clean(self)

    def _build_job(self):
        if self._jid is not None:
            raise SystemError("Already building a job...")
        if self._sysd is None:
            self._sysd = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/")
        self._jid = self._sysd.build_job()

    def _enqueue_job(self):
        if self._jid is None:
            raise SystemError("Not building a job...")
        self._sysd.enqueue_job(self._jid)
        self._jid = None

    @property
    def lvm(self):
        if self._lvm is None:
            self._lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        return self._lvm

    @property
    def status(self):
        attr = self.lvm_info["LVM2_LV_ATTR"].lower()
        # lv_attr bits: see ``man lvs''
        # flags are returned in a way that in most normal cases, the status string is as short as possible.
        flags = [
            {
                "m": "mirrored",       "M": "mirrored without initial sync",
                "o": "origin",         "O": "merging origin",
                "r": "RAID",           "R": "RAID without initial sync",
                "s": "snapshot",       "S": "merging snapshot",
                "p": "pvmove",         "v": "virtual",
                "i": "image",          "I": "out-of-sync image",
                "l": "mirror log",     "c": "conversion",
                "V": "thin volume",    "t": "thin pool",
                "T": "thin pool data", "e": "RAID/thin pool metadata",
                '-': None
            }[ attr[0] ],
            {"w": None, "r": "read-only", "R": "temporarily read-only"}[ attr[1] ],
            {
                "a": "anywhere",       "c": "contiguous allocation",
                "i": None,             "l": "cling allocation",
                "n": "normal allocation"
            }[ attr[2].lower() ],
            {"m": "fixed minor", "-": None}[ attr[3] ],
            {
                "a": "active",         "s": "suspended",
                "I": "invalid snapshot", "S": "invalid suspended snapshot",
                "m": "snapshot merge failed", "M": "suspended snapshot merge failed",
                "d": "mapped device present without tables", "i": "mapped device present with inactive table"
            }[ attr[4] ],
            {"o": "open", "-": None}[ attr[5] ],
            {
                "m": "mirror",    "r": "raid",
                "s": "snapshot",  "t": "thin",
                "u": "unknown",   "v": "virtual",
                "-": None
            }[ attr[6] ],
            {"z": "zeroed",  "-": None}[ attr[7] ],
            #{"p": "partial", "-": None}[ attr[8] ],
        ]
        if attr[2] in ("A", "C", "I", "L", "N"):
            flags.append("pvmove in progress")
        return ", ".join([flag for flag in flags if flag is not None])

    @property
    def path(self):
        """ The actual device under which this LV operates. """
        return os.path.join( "/dev", self.vg.name, self.name )

    @property
    def host(self):
        return self.vg.host

    @property
    def dmdevice( self ):
        """ Returns the dm-X device that represents this LV. """
        return os.path.realpath( self.path )

    @property
    def disk_stats( self ):
        """ Return disk stats from the LV retrieved from the kernel. """
        return blockdevices.get_disk_stats( self.dmdevice[5:] )

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

    def detect_fs(self):
        """ Try to detect the file system using `file'. """
        typestring = self.lvm.get_type(self.path)
        for fs in FILESYSTEMS:
            if fs.check_type(typestring):
                return fs
        return None

    def get_shares( self, app_label=None ):
        """ Iterate all the shares configured for this LV. """
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if app_label  and relobj.model._meta.app_label != app_label:
                continue

            if not hasattr( relobj.model, "share_type" ):
                # not a share
                continue

            for relmdl in relobj.model.objects.filter( **{ relobj.field.name: self } ):
                yield relmdl

    @property
    def lvm_info(self):
        """ LV information from LVM. """
        if self._lvm_info is None:
            self._lvm_info = dbus_to_python(self.lvm.lvs())[self.name]
        return self._lvm_info

    @property
    def lvm_megs(self):
        """ The actual size of this LV in Megs, retrieved from LVM. """
        return float(self.lvm_info["LVM2_LV_SIZE"][:-1])

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

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat

    def mount(self):
        if self.formatted and not self.mounted:
            lvm_signals.pre_mount.send(sender=LogicalVolume, instance=self, mountpoint=self.mountpoint)
            self.fs.mount(-1)
            lvm_signals.post_mount.send(sender=LogicalVolume, instance=self, mountpoint=self.mountpoint)

    def unmount(self):
        if self.mounted:
            lvm_signals.pre_unmount.send(sender=LogicalVolume, instance=self, mountpoint=self.mountpoint)
            self.fs.unmount(-1)
            lvm_signals.post_unmount.send(sender=LogicalVolume, instance=self, mountpoint=self.mountpoint)

    def install(self):
        lvm_signals.pre_install.send(sender=LogicalVolume, instance=self)
        if self.snapshot:
            snap = self.snapshot.device
        else:
            snap = ""
        self.lvm.lvcreate( self.vg.name, self.name, self.megs, snap )
        if not self.snapshot:
            self.lvm.lvchange( self.path, True )
        lvm_signals.post_install.send(sender=LogicalVolume, instance=self)

    def uninstall(self):
        lvm_signals.pre_uninstall.send(sender=LogicalVolume, instance=self)
        if not self.snapshot:
            self.lvm.lvchange(self.path, False)
        self.lvm.lvremove(self.path)
        lvm_signals.post_uninstall.send(sender=LogicalVolume, instance=self)

    def resize( self ):
        if self.filesystem and self.mounted and \
           not self.fs.online_resize_available(self.megs > self.lvm_megs):
            self.fs.unmount(self._jid)
            need_mount = True
        else:
            need_mount = False

        if self.megs < self.lvm_megs:
            # Shrink FS, then Volume
            lvm_signals.pre_shrink.send(sender=LogicalVolume, instance=self, jid=self._jid)

            if self.filesystem:
                self.fs.resize(self._jid, grow=False)

            for mod in self.modchain:
                mod.resize(self._jid)

            self.lvm.lvresize(self._jid, self.path, self.megs, False)

            lvm_signals.post_shrink.send(sender=LogicalVolume, instance=self, jid=self._jid)
        else:
            # Grow Volume, then FS
            lvm_signals.pre_grow.send(sender=LogicalVolume, instance=self, jid=self._jid)

            self.lvm.lvresize(self._jid, self.path, self.megs, True)

            for mod in self.modchain:
                mod.resize(self._jid)

            if self.filesystem:
                self.fs.resize(self._jid, grow=True)

            lvm_signals.post_grow.send(sender=LogicalVolume, instance=self, jid=self._jid)

        if need_mount:
            self.fs.mount(self._jid)

        self._lvm_info = None # outdate cached information

    def setupfs( self ):
        if not self.formatted:
            self.fs.format(self._jid)
            self.formatted = True
            return True
        else:
            self.fs.mount(self._jid)
            return False

    def clean(self):
        if not self.snapshot:
            from django.core.exceptions import ValidationError
            if not self.owner:
                raise ValidationError(_('The owner field is required unless you are creating a snapshot.'))
            if not self.vg:
                raise ValidationError(_('The vg field is required unless you are creating a snapshot.'))
        elif self.snapshot.snapshot:
            raise ValidationError(_('LVM does not support snapshotting snapshots.'))
        if self.filesystem:
            self.fs.clean_volume(self)

    def save( self, database_only=False, *args, **kwargs ):
        if database_only:
            return BlockVolume.save(self, *args, **kwargs)

        install = (self.id is None)

        if self.snapshot:
            self.owner = self.snapshot.owner
            self.vg    = self.snapshot.vg
            self.filesystem = self.snapshot.filesystem
            self.formatted  = self.snapshot.formatted

        if self.id is not None:
            old_self = LogicalVolume.objects.get(id=self.id)

        ret = BlockVolume.save(self, *args, **kwargs)

        self._build_job()

        if install:
            self.install()
            self.uuid = self.lvm_info["LVM2_LV_UUID"]

            if self.filesystem:
                modified = self.setupfs()
                self.lvm.write_fstab()

            ret = BlockVolume.save(self, *args, **kwargs)

        else:
            if old_self.megs != self.megs:
                self.resize()

        self._enqueue_job()

        return ret

    def delete(self):
        for share in self.get_shares():
            share.delete()

        if self.filesystem:
            if self.mounted:
                self.fs.unmount(-1)
            self.fs.destroy()

        self.uninstall()

        BlockVolume.delete(self)

        if self.filesystem:
            self.lvm.write_fstab()

    def merge(self):
        if self.snapshot is None:
            raise LogicalVolume.NotASnapshot(self.name)
        orig = self.snapshot
        orig.unmount()
        for snapshot in orig.snapshot_set.all():
            snapshot.unmount()
        self.lvm.lvmerge(  self.path )
        BlockVolume.delete(self)
        for snapshot in orig.snapshot_set.all():
            snapshot.mount()
        orig.mount()


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
    is_active   = models.BooleanField()
    conf        = models.ForeignKey('SnapshotConf')

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def full_clean(self):
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
                snapcore.process_config(conf_obj)
            else:
                self.add_config(conf_obj)
        else:
            raise KeyError("scheduling informations not found in config dictionary")

    def add_config(self, conf_obj):
        data = conf_obj["data"]
        snapconf = SnapshotConf(confname=data["configname"], prescript=data["prescript"], postscript=data["postscript"], retention_time=data["retention_time"], last_execution=None)
        snapconf.save()

        time_configs = {'h': [], 'moy': [], 'dow': []}
        startdate = enddate = minute = day_of_month = '';

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
