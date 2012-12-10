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

import dbus
import re
import os
import os.path

from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from django.utils.translation   import ugettext_lazy as _

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from systemd.helpers import dbus_to_python
from lvm.filesystems import Zfs, FILESYSTEMS, get_by_name as get_fs_by_name
from lvm             import signals as lvm_signals
from lvm.conf        import settings as lvm_settings


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


class VolumeGroup(models.Model):
    """ Represents a LVM Volume Group. """

    name        = models.CharField(max_length=130, unique=True, validators=[validate_vg_name])
    host        = models.ForeignKey(Host, null=True)

    objects     = HostDependentManager()
    all_objects = models.Manager()

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._lvm_info = None

    def __unicode__(self):
        return self.name

    def join_device(self, device):
        """ Reformat a device as a Physical Volume and add it to this Volume Group. """
        if VolumeGroup.is_device_in_use(device):
            raise ValueError( "Device '%s' is in use, won't touch it." % device )
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        return lvm.join_device_to_vg(device, self.name)

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
        models.Model.delete(self)

    @classmethod
    def get_mounts(cls):
        """ Get currently mounted devices. """
        fd = open("/proc/mounts", "rb")
        try:
            mounts = fd.read()
        finally:
            fd.close()
        return [ line.split(" ") for line in mounts.split("\n") if line ]

    @classmethod
    def get_devices(cls):
        """ Get existing block devices. """
        devinfo = []

        def getfile(basedir, fname):
            fd = open( os.path.join( basedir, fname ), "rb")
            try:
                return fd.read().strip()
            finally:
                fd.close()

        for dirname in os.listdir("/sys/bus/scsi/devices"):
            if re.match( "^\d+:\d+:\d+:\d+$", dirname ):
                basedir = os.path.join( "/sys/bus/scsi/devices", dirname )
                if not os.path.exists(os.path.join( basedir, "block" )):
                    continue
                devinfo.append({
                    "type":   getfile(basedir, "type"),
                    "vendor": getfile(basedir, "vendor"),
                    "model":  getfile(basedir, "model"),
                    "rev":    getfile(basedir, "rev"),
                    "block":  os.listdir( os.path.join( basedir, "block" ) )[0]
                    })

        return devinfo

    @classmethod
    def is_device_in_use(cls, device):
        """ Check if this device is mounted somewhere or used as a physical volume. """
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        pvs = lvm.pvs()
        for pvdev in pvs:
            if device in pvdev:
                return True, "pv", unicode(pvs[pvdev]["LVM2_VG_NAME"])
        for mount in VolumeGroup.get_mounts():
            if device in os.path.realpath(mount[0]):
                return True, "mount", mount[1]
        return False

    @classmethod
    def get_partitions(cls, device):
        """ Get partitions from the given device. """
        lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        ret, disk, part = lvm.get_partitions(device)
        if ret:
            raise SystemError("parted failed, check the log")
        return dbus_to_python(disk), dbus_to_python(part)

    @classmethod
    def get_disk_stats(cls, device):
        """ Get disk stats from `/sys/block/X/stat'. """
        if not os.path.exists( "/sys/block/%s/stat" % device ):
            raise SystemError( "No such device: '%s'" % device )

        fd = open("/sys/block/%s/stat" % device, "rb")
        try:
            stats = fd.read().split()
        finally:
            fd.close()

        return dict( zip( [
            "reads_completed",  "reads_merged",  "sectors_read",    "millisecs_reading",
            "writes_completed", "writes_merged", "sectors_written", "millisecs_writing",
            "ios_in_progress",  "millisecs_in_io", "weighted_millisecs_in_io"
            ], [ int(num) for num in stats ] ) )

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


class LogicalVolume(models.Model):
    """ Represents a LVM Logical Volume and offers management functions.

        This is the main class of openATTIC's design.
    """

    name        = models.CharField(max_length=130, validators=[validate_lv_name])
    megs        = models.IntegerField(_("Size in MB"))
    vg          = models.ForeignKey(VolumeGroup, blank=True)
    snapshot    = models.ForeignKey("self", blank=True, null=True)
    filesystem  = models.CharField(max_length=20, blank=True, choices=[(__fs.name, __fs.desc) for __fs in FILESYSTEMS] )
    formatted   = models.BooleanField(default=False, editable=False)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    objects = getHostDependentManagerClass("vg__host")()
    all_objects = models.Manager()

    class Meta:
        unique_together = ("vg", "name")

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._sysd = None
        self._lvm = None
        self._lvm_info = None
        self._fs = None
        self._jid = None

    def __unicode__(self):
        return self.name

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

    @classmethod
    def get_capabilities(cls):
        lvm  = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        return dbus_to_python(lvm.get_capabilities())

    @property
    def lvm(self):
        if self._lvm is None:
            self._lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
        return self._lvm

    @property
    def device(self):
        """ The actual device under which this LV operates. """
        return os.path.join( "/dev", self.vg.name, self.name )

    @property
    def dmdevice( self ):
        """ Returns the dm-X device that represents this LV. """
        return os.path.realpath( self.device )

    @property
    def disk_stats( self ):
        """ Return disk stats from the LV retrieved from the kernel. """
        return VolumeGroup.get_disk_stats( self.dmdevice[5:] )

    @property
    def fs(self):
        """ An instance of the filesystem handler class for this LV (if any). """
        if not self.filesystem:
            return None
        else:
            if self._fs is None:
                self._fs = get_fs_by_name(self.filesystem)(self)
            return self._fs

    @property
    def fs_info(self):
        if not self.filesystem:
            return None
        return self.fs.info

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
    def modchain( self, app_label=None ):
        """ A list of block device modules operating on this LV, in the order
            in which they are chained.
        """
        mc = []
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if app_label  and relobj.model._meta.app_label != app_label:
                continue

            if not issubclass( relobj.model, LVChainedModule ):
                # not a mod
                continue

            mc.extend( relobj.model.objects.filter( **{ relobj.field.name: self } ) )

        mc.sort(lambda a, b: cmp(a.ordering, b.ordering))
        return mc

    @property
    def path(self):
        """ Returns the block device on which the file system resides,
            taking block device modules into account.
        """
        mc = self.modchain
        if not mc:
            return self.device
        return mc[-1].path

    @property
    def standby(self):
        """ Returns true if mods are configured and at least one reports
            itself as in standby.
        """
        for mod in self.modchain:
            if mod.standby:
                return True
        return False

    @property
    def mods_active(self):
        """ True if no mods are in use or all mods are active. """
        for mod in self.modchain:
            return False
        return True

    @property
    def lvm_info(self):
        """ LV information from LVM. """
        if self._lvm_info is None:
            self._lvm_info = dbus_to_python(self.lvm.lvs())[self.name]
            self._lvm_info['LVM2_SEG_PE_RANGES'] = self._lvm_info['LVM2_SEG_PE_RANGES'].split(' ')
        return self._lvm_info

    @property
    def lvm_megs(self):
        """ The actual size of this LV in Megs, retrieved from LVM. """
        return float(self.lvm_info["LVM2_LV_SIZE"][:-1])

    ##########################
    ### PROCESSING METHODS ###
    ##########################

    @property
    def mountpoint(self):
        if not self.filesystem:
            raise SystemError("Volume '%s' does not have a filesystem, cannot mount." % self.name)
        return os.path.join(lvm_settings.MOUNT_PREFIX, self.vg.name, self.name)

    @property
    def mounted(self):
        return self.fs.mounted_at(self.mountpoint)

    @property
    def stat(self):
        return self.fs.stat(self.mountpoint)

    def mount(self):
        if self.formatted and not self.mounted_at(self.mountpoint):
            lvm_signals.pre_mount.send(sender=self, mountpoint=self.mountpoint)
            self.fs.mount(-1, self.mountpoint)
            lvm_signals.post_mount.send(sender=self, mountpoint=self.mountpoint)

    def unmount(self):
        if self.mounted_at(self.mountpoint):
            lvm_signals.pre_unmount.send(sender=self, mountpoint=self.mountpoint)
            self.fs.unmount(-1, self.mountpoint)
            lvm_signals.post_unmount.send(sender=self, mountpoint=self.mountpoint)

    def install(self):
        lvm_signals.pre_install.send(sender=self)
        if self.snapshot:
            snap = self.snapshot.device
        else:
            snap = ""
        self.lvm.lvcreate( self.vg.name, self.name, self.megs, snap )
        if not self.snapshot:
            self.lvm.lvchange( self.device, True )
        lvm_signals.post_install.send(sender=self)

    def uninstall(self):
        lvm_signals.pre_uninstall.send(sender=self)
        if not self.snapshot:
            self.lvm.lvchange(self.device, False)
        self.lvm.lvremove(self.device)
        lvm_signals.post_uninstall.send(sender=self)

    def resize( self ):
        if self.filesystem and self.mounted and \
           not self.fs.online_resize_available(self.megs > self.lvm_megs):
            self.fs.unmount(self._jid, self.mountpoint)
            need_mount = True
        else:
            need_mount = False

        if self.megs < self.lvm_megs:
            # Shrink FS, then Volume
            lvm_signals.pre_shrink.send(sender=self, jid=self._jid)

            if self.filesystem:
                self.fs.resize(self._jid, grow=False)

            for mod in self.modchain:
                mod.resize(self._jid)

            self.lvm.lvresize(self._jid, self.device, self.megs, False)

            lvm_signals.post_shrink.send(sender=self, jid=self._jid)
        else:
            # Grow Volume, then FS
            lvm_signals.pre_grow.send(sender=self, jid=self._jid)

            self.lvm.lvresize(self._jid, self.device, self.megs, True)

            for mod in self.modchain:
                mod.resize(self._jid)

            if self.filesystem:
                self.fs.resize(self._jid, grow=True)

            lvm_signals.post_grow.send(sender=self, jid=self._jid)

        if need_mount:
            self.fs.mount(self._jid, self.mountpoint)

        self._lvm_info = None # outdate cached information

    def setupfs( self ):
        if not self.formatted:
            self.fs.format(self._jid)
            self.formatted = True
            return True
        else:
            self.fs.mount(self._jid, self.mountpoint)
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

    def save( self, database_only=False, *args, **kwargs ):
        if database_only:
            return models.Model.save(self, *args, **kwargs)

        install = (self.id is None)

        if self.snapshot:
            self.owner = self.snapshot.owner
            self.vg    = self.snapshot.vg
            self.filesystem = self.snapshot.filesystem
            self.formatted  = self.snapshot.formatted

        if self.id is not None:
            old_self = LogicalVolume.objects.get(id=self.id)

        ret = models.Model.save(self, *args, **kwargs)

        self._build_job()

        if install:
            self.install()

            if self.filesystem:
                mc = self.modchain
                modified = False
                if mc:
                    modified = mc[-1].setupfs()
                else:
                    modified = self.setupfs()
                self.lvm.write_fstab()

                if modified:
                    ret = models.Model.save(self, *args, **kwargs)

        else:
            if old_self.megs != self.megs:
                self.resize()

        self._enqueue_job()

        return ret

    def delete(self):
        for share in self.get_shares():
            share.delete()

        mc = self.modchain[:]
        mc.reverse()
        for mod in mc:
            mod.delete()

        if self.filesystem:
            if self.mounted:
                self.fs.unmount(-1, self.mountpoint)
            self.fs.destroy()

        self.uninstall()

        models.Model.delete(self)

        if self.filesystem:
            self.lvm.write_fstab()


class LVChainedModule(models.Model):
    """ Represents block device oriented modules that create a block device
        themselves, like DRBD or openDedup. This class only manages the
        ordering and the link to the LV.
    """

    volume      = models.ForeignKey(LogicalVolume)
    ordering    = models.IntegerField(default=0)

    standby     = False

    @property
    def basedev(self):
        """ Return the device on which this mod is operating. """
        mc = self.volume.modchain
        if mc[0] == self:
            return self.volume.device
        else:
            last = self.volume
            for curr in mc:
                if curr == self:
                    return last.path
                last = curr

    def setupfs(self):
        return self.volume.setupfs()

    def install(self):
        return

    def resize(self, jid):
        return

    def uninstall(self):
        return

    class Meta:
        unique_together = ("volume", "ordering")
        abstract = True

    def save( self, *args, **kwargs ):
        if not self.id:
            self.install()
        return models.Model.save(self, *args, **kwargs)

    def delete(self):
        self.uninstall()
        models.Model.delete(self)


class ZfsSubvolume(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    volname     = models.CharField(max_length=50)

    lvm = LogicalVolume.lvm
    objects = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._lvm = None
        self._fs = None

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.volume.filesystem != Zfs.name:
            raise ValidationError('This share type can only be used on ZFS volumes.')

    @property
    def name(self):
        return "%s/%s" % (self.volume.name, self.volname)

    @property
    def fs(self):
        """ An instance of the filesystem handler class for this Subvolume. """
        if self._fs is None:
            self._fs = get_fs_by_name(self.volume.filesystem)(self)
        return self._fs

    @property
    def path(self):
        return self.volume.path

    def save( self, *args, **kwargs ):
        ret = models.Model.save(self, *args, **kwargs)
        self.volume._build_job()
        self.volume.fs.create_subvolume(self.volume._jid, self)
        self.volume._enqueue_job()
        return ret

    def delete( self ):
        for snap in self.zfssnapshot_set.all():
            snap.delete()
        ret = models.Model.delete(self)
        self.volume.fs.destroy_subvolume(self)
        return ret


class ZfsSnapshot(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    subvolume   = models.ForeignKey(ZfsSubvolume, blank=True, null=True)
    snapname    = models.CharField(max_length=50)
    created_at  = models.DateTimeField(auto_now_add=True)

    lvm = LogicalVolume.lvm
    objects = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

    def __init__( self, *args, **kwargs ):
        if "volume" not in kwargs and "subvolume" in kwargs:
            kwargs["volume"] = kwargs["subvolume"].volume
        models.Model.__init__( self, *args, **kwargs )
        self._lvm = None
        self._fs  = None

    def full_clean(self):
        # this needs to be run before the fields are checked
        try:
            self.volume
        except LogicalVolume.DoesNotExist:
            if self.subvolume is not None:
                self.volume = self.subvolume.volume
            else:
                raise
        return models.Model.full_clean(self)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.volume.filesystem != Zfs.name:
            raise ValidationError('This share type can only be used on ZFS volumes.')

    @property
    def origvolume(self):
        if self.subvolume:
            return self.subvolume
        return self.volume

    @property
    def name(self):
        return "%s@%s" % (self.origvolume.name, self.snapname)

    @property
    def fs(self):
        """ An instance of the filesystem handler class for this Subvolume. """
        if self._fs is None:
            self._fs = get_fs_by_name(self.volume.filesystem)(self)
        return self._fs

    @property
    def path(self):
        return self.volume.path

    def save( self, *args, **kwargs ):
        self.volume._build_job()
        self.volume.fs.create_snapshot(self.volume._jid, self)
        self.volume._enqueue_job()
        return models.Model.save(self, *args, **kwargs)

    def delete( self, database_only=False ):
        if not database_only:
            self.volume.fs.destroy_snapshot(self)
        return models.Model.delete(self)

    def rollback( self ):
        if self.subvolume is not None:
            kwds = {"subvolume": self.subvolume}
        else:
            kwds = {"subvolume__isnull": True}
        kwds["volume"] = self.volume
        kwds["created_at__gt"] = self.created_at
        print kwds
        for snap in ZfsSnapshot.objects.filter(**kwds):
            snap.delete(database_only=True) # -R will take care of them in the system
        self.volume.fs.rollback_snapshot(self)

class LVMetadata(models.Model):
    """ Stores arbitrary metadata for a volume. This can be anything you like,
        and it is indended to be used by third party programs.
    """
    volume  = models.ForeignKey(LogicalVolume)
    key     = models.CharField(max_length=255)
    value   = models.CharField(max_length=255)

    objects = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()
