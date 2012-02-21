# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
import re
import os
import os.path
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from django.utils.translation   import ugettext_noop, ugettext_lazy as _

from systemd.helpers import dbus_to_python
from lvm.filesystems import Zfs, FILESYSTEMS, get_by_name as get_fs_by_name
from lvm             import signals as lvm_signals


class VolumeGroup(models.Model):
    """ Represents a LVM Volume Group. """

    name        = models.CharField(max_length=130, unique=True)

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._lvm_info = None

    def __unicode__(self):
        return "%s (%s MB free)" % (self.name, self.lvm_info['LVM2_VG_FREE'])

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

        def getfile(basefir, fname):
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

    name        = models.CharField(max_length=130, unique=True)
    megs        = models.IntegerField(_("Size in MB"))
    vg          = models.ForeignKey(VolumeGroup, blank=True)
    snapshot    = models.ForeignKey("self", blank=True, null=True)
    filesystem  = models.CharField(max_length=20, blank=True, choices=[(fs.name, fs.desc) for fs in FILESYSTEMS] )
    formatted   = models.BooleanField(default=False, editable=False)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._lvm = None
        self._lvm_info = None
        self._fs = None

    def __unicode__(self):
        return self.name

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

    def get_shares( self, app_label=None ):
        """ Iterate all the shares configured for this LV. """
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if app_label  and relobj.model._meta.app_label != app_label:
                continue;

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
                continue;

            if not issubclass( relobj.model, LVChainedModule ):
                # not a mod
                continue

            mc.extend( relobj.model.objects.filter( **{ relobj.field.name: self } ) )

        mc.sort(lambda a,b: cmp(a.ordering, b.ordering))
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

    def install( self ):
        lvm_signals.pre_install.send(sender=self)
        if self.snapshot:
            snap = self.snapshot.device
        else:
            snap = ""
        self.lvm.lvcreate( self.vg.name, self.name, self.megs, snap )
        if not self.snapshot:
            self.lvm.lvchange( self.device, True )
        lvm_signals.post_install.send(sender=self)

    def uninstall( self ):
        lvm_signals.pre_uninstall.send(sender=self)
        for share in self.get_shares():
            share.delete()

        mc = self.modchain[:]
        mc.reverse()
        for mod in mc:
            mod.delete()

        if not self.snapshot:
            self.lvm.lvchange(self.device, False)
        self.lvm.lvremove(self.device)
        lvm_signals.post_uninstall.send(sender=self)

    def resize( self ):
        sysd = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/")
        jid  = sysd.build_job()

        if self.filesystem and self.fs.mounted and \
           not self.fs.online_resize_available(self.megs > self.lvm_megs):
            sysd.job_add_command(jid, ["umount", self.fs.mountpoints[0].encode("ascii")])
            need_mount = True
        else:
            need_mount = False

        if self.megs < self.lvm_megs:
            # Shrink FS, then Volume
            lvm_signals.pre_shrink.send(sender=self, jid=jid)

            if self.filesystem:
                self.fs.resize(jid, grow=False)

            for mod in self.modchain:
                mod.resize(jid)

            self.lvm.lvresize(jid, self.device, self.megs, False)

            lvm_signals.post_shrink.send(sender=self, jid=jid)
        else:
            # Grow Volume, then FS
            lvm_signals.pre_grow.send(sender=self, jid=jid)

            self.lvm.lvresize(jid, self.device, self.megs, True)

            for mod in self.modchain:
                mod.resize(jid)

            if self.filesystem:
                self.fs.resize(jid, grow=True)

            lvm_signals.post_grow.send(sender=self, jid=jid)

        if need_mount:
            sysd.job_add_command(jid, ["mount", self.fs.mountpoints[0].encode("ascii")])

        sysd.enqueue_job(jid)
        self._lvm_info = None # outdate cached information

    def setupfs( self ):
        if not self.formatted:
            self.fs.format()
            self.formatted = True
            return True
        else:
            self.fs.mount()
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

        ret = models.Model.save(self, *args, **kwargs)

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

        elif self.megs != self.lvm_megs:
            self.resize()

        return ret

    def delete(self):
        """ If active, transition to delete; if new or done, actually call delete().

            Overrides models.Model.delete() in order to cascade to all shares and
            block device modules.
        """
        if self.filesystem:
            if self.fs.mounted:
                self.fs.unmount()
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
        unique_together=("volume", "ordering")
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
        self.volume.lvm.zfs_create_volume(self.volume.name, self.volname)
        return ret

    def delete( self ):
        ret = models.Model.delete(self)
        self.volume.lvm.zfs_destroy_volume(self.volume.name, self.volname)
        return ret


class ZfsSnapshot(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    subvolume   = models.ForeignKey(ZfsSubvolume, blank=True, null=True)
    snapname    = models.CharField(max_length=50)
    created_at  = models.DateTimeField(auto_now_add=True)

    lvm = LogicalVolume.lvm

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
        self.volume.lvm.zfs_create_snapshot(self.origvolume.name, self.snapname)
        return models.Model.save(self, *args, **kwargs)

    def delete( self, database_only=False ):
        if not database_only:
            self.volume.lvm.zfs_destroy_snapshot(self.origvolume.name, self.snapname)
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
        self.volume.lvm.zfs_rollback_snapshot(self.origvolume.name, self.snapname)

class LVMetadata(models.Model):
    """ Stores arbitrary metadata for a volume. This can be anything you like,
        and it is indended to be used by third party programs.
    """
    volume = models.ForeignKey(LogicalVolume)
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)
