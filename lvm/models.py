# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
import re
import os.path
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

from systemd.helpers import dbus_to_python
from lvm.filesystems import FILESYSTEMS, get_by_name as get_fs_by_name
from lvm             import signals as lvm_signals

SETUP_STATE_CHOICES = (
    ("new",     "[new]     Set for installation, but has not yet started"),
    ("pending", "[pending] Installation is running"),
    ("active",  "[active]  Installation has finished"),
    ("update",  "[update]  Configuration changes need to be applied"),
    ("delete",  "[delete]  Set for removal, but has not yet started"),
    ("dpend",   "[dpend]   Removal is running"),
    ("done",    "[done]    Removal has finished")
    )


class StatefulModel(models.Model):
    """ Base class for stateful models.

        This model has a state field, which is checked and updated on save()
        calls. Newly created models set the state to "new", active models
        change state to "update" when save()d.

        In order to change the state to other states, call the according
        set_* method. Those methods are intended to be called by installer
        modules only.
    """

    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    def save(self, ignore_state=False, *args, **kwargs):
        """ Set state to new/update and call the original save() method.
            Also prevent the model from being save()d while in a "pending" state.
        """
        if not ignore_state:
            if self.id is None:
                self.state = "new"
            elif self.state == "active":
                self.state = "update"
            elif self.state in ("pending", "delete", "dpend"):
                raise RuntimeError("Cannot save while in a pending state (installation running!)")
        return models.Model.save(self, *args, **kwargs)

    def set_active(self):
        """ If state is pending, transition to active. """
        if self.state != "pending":
            raise RuntimeError("Cannot transition from '%s' to 'active'" % self.state)
        self.state = "active"
        return models.Model.save(self)

    def set_pending(self):
        """ If state is not new or update, transition to pending. """
        if self.state not in ("new", "update"):
            raise RuntimeError("Cannot transition from '%s' to 'pending'" % self.state)
        self.state = "pending"
        return models.Model.save(self)

    def set_dpend(self):
        """ If state is delete, transition to dpend. """
        if self.state != "delete":
            raise RuntimeError("Cannot transition from '%s' to 'dpend'" % self.state)
        self.state = "dpend"
        return models.Model.save(self)

    def set_done(self):
        """ If state is dpend, transition to done. """
        if self.state != "dpend":
            raise RuntimeError("Cannot transition from '%s' to 'done'" % self.state)
        self.state = "done"
        return models.Model.save(self)

    def delete(self):
        """ If active, transition to delete; if new or done, actually call delete(). """
        if self.state == "active":
            self.state = "delete"
            models.Model.save(self)
        elif self.state in ("new", "done"):
            models.Model.delete(self)
        elif self.state == "delete":
            pass
        else:
            raise RuntimeError("Cannot transition from '%s' to 'delete'" % self.state)

    class Meta:
        abstract = True

class VolumeGroup(models.Model):
    """ Represents a LVM Volume Group. """

    name        = models.CharField(max_length=130, unique=True)

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._lvm_info = None

    def __unicode__(self):
        return "%s (%s MB free)" % (self.name, self.lvm_info['LVM2_VG_FREE'])

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
        """ Get existing block devices that correspond to hardware disks. """
        fd = open("/proc/partitions", "rb")
        try:
            partitions = fd.read()
        finally:
            fd.close()
        regex = re.compile("^\s*\d+\s+\d+\s+\d+\s([a-zA-Z]+)$")
        devs = []
        for line in partitions.split("\n"):
            m = regex.match(line)
            if m:
                devs.append(m.group(1))
        return devs

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



class LogicalVolume(StatefulModel):
    """ Represents a LVM Logical Volume and offers management functions.

        This is the main class of openATTIC's design.
    """

    name        = models.CharField(max_length=130, unique=True)
    megs        = models.IntegerField("Size in MB")
    vg          = models.ForeignKey(VolumeGroup)
    snapshot    = models.ForeignKey("self", blank=True, null=True)
    filesystem  = models.CharField(max_length=20, blank=True, null=True,
                    choices=[(fs.name, fs.desc) for fs in FILESYSTEMS] )
    formatted   = models.BooleanField(default=False, editable=False)
    owner       = models.ForeignKey(User)

    def __init__( self, *args, **kwargs ):
        StatefulModel.__init__( self, *args, **kwargs )
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
            if mod.state != "active":
                return False
        return True

    @property
    def lvm_info(self):
        """ LV information from LVM. """
        if self.state not in ("active", "update", "pending"):
            return None
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

    def install( self ):
        lvm_signals.pre_install.send(sender=self)
        if self.snapshot:
            snap = self.snapshot.device
            # Don't reformat the snapshot :)
            self.filesystem = self.snapshot.filesystem
            self.formatted  = self.snapshot.formatted
        else:
            snap = ""
        self.lvm.lvcreate( self.vg.name, self.name, self.megs, snap )
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

        self.lvm.lvchange(self.device, False)
        self.lvm.lvremove(self.device)
        lvm_signals.post_uninstall.send(sender=self)

    def resize( self ):
        if self.megs < self.lvm_megs:
            # Shrink FS, then Volume
            lvm_signals.pre_shrink.send(sender=self)
            if self.filesystem:
                self.fs.resize(grow=False)
            for mod in self.modchain:
                mod.resize()
            self.lvm.lvresize(self.device, self.megs)
            lvm_signals.post_shrink.send(sender=self)
        else:
            # Grow Volume, then FS
            lvm_signals.pre_grow.send(sender=self)
            self.lvm.lvresize(self.device, self.megs)
            for mod in self.modchain:
                mod.resize()
            if self.filesystem:
                self.fs.resize(grow=True)
            lvm_signals.post_grow.send(sender=self)

    def setupfs( self ):
        if not self.formatted:
            self.fs.format()
        self.fs.mount()
        if not self.formatted:
            self.fs.chown()
            self.formatted = True

    def save( self, *args, **kwargs ):
        self.state = "active"
        install = (self.id is None)
        ret = StatefulModel.save(self, ignore_state=True, *args, **kwargs)

        if install:
            self.install()
        elif self.megs != self.lvm_megs:
            if self.filesystem and self.fs.mounted:
                self.fs.unmount()
            self.resize()
            self.megs = self.lvm_megs

        if self.filesystem:
            mc = self.modchain
            if mc:
                mc[-1].setupfs()
            else:
                self.setupfs()
            self.lvm.write_fstab()

        return ret

    def delete(self):
        """ If active, transition to delete; if new or done, actually call delete().

            Overrides StatefulModel.delete() in order to cascade to all shares and
            block device modules.
        """
        if self.filesystem and self.fs.mounted:
            self.fs.unmount()
        self.uninstall()
        models.Model.delete(self)
        if self.filesystem:
            self.lvm.write_fstab()


class LVChainedModule(StatefulModel):
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
        self.volume.setupfs()

    def install(self):
        return

    def resize(self):
        return

    def uninstall(self):
        return

    class Meta:
        unique_together=("volume", "ordering")
        abstract = True

    def save( self, *args, **kwargs ):
        if not self.id:
            self.install()
        self.state = "active"
        return StatefulModel.save(self, ignore_state=True, *args, **kwargs)

    def delete(self):
        self.uninstall()
        models.Model.delete(self)
