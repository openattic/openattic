# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

from lvm.filesystems import FILESYSTEMS, get_by_name as get_fs_by_name

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

    @property
    def lvm_info(self):
        """ VG information from LVM. """
        if self._lvm_info is None:
            lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
            self._lvm_info = lvm.vgs()[self.name]
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
        return "/dev/%s/%s" % ( self.vg.name, self.name )

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
            self._lvm_info = self.lvm.lvs()[self.name]
        return self._lvm_info

    @property
    def lvm_megs(self):
        """ The actual size of this LV in Megs, retrieved from LVM. """
        return float(self.lvm_info["LVM2_LV_SIZE"][:-1])

    def save( self, *args, **kwargs ):
        if not self.id:
            if self.snapshot:
                snap = self.snapshot.device
            else:
                snap = ""
            self.lvm.lvcreate( self.vg.name, self.name, self.megs, snap )
            self.lvm.lvchange( self.device, True )

            if self.filesystem:
                self.fs.format()
                self.fs.mount()
                self.fs.chown()

        elif self.megs != self.lvm_megs:
            if self.filesystem:
                self.fs.unmount()

            self.lvm.lvchange(self.device, False)
            if self.megs < self.lvm_megs:
                # Shrink FS, then Volume
                if self.filesystem:
                    self.fs.resize(grow=False)
                self.lvm.lvresize(self.device, self.megs)
            else:
                # Grow Volume, then FS
                self.lvm.lvresize(self.device, self.megs)
                if self.filesystem:
                    self.fs.resize(grow=True)

            if self.filesystem:
                self.fs.mount()
        return StatefulModel.save(self, *args, **kwargs)

    def delete(self):
        """ If active, transition to delete; if new or done, actually call delete().

            Overrides StatefulModel.delete() in order to cascade to all shares and
            block device modules.
        """
        if self.filesystem:
            self.fs.unmount()

        #mc = lv.modchain[:]
        #mc.reverse()
        #for mod in mc:
            #if mod.state == "delete":
                #mod.uninstall()

        self.lvm.lvchange(self.device, False)
        self.lvm.lvremove(self.device)
        models.Model.delete(self)


class LVChainedModule(StatefulModel):
    """ Represents block device oriented modules that create a block device
        themselves, like DRBD or openDedup. This class only manages the
        ordering and the link to the LV.
    """

    volume      = models.ForeignKey(LogicalVolume)
    ordering    = models.IntegerField(default=0)

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

    # format_policy:
    #  * "ok"      if ready to be formatted/used otherwise
    #  * "skip"    if formatting is not necessary (DRBD Secondaries)
    format_policy = "ok"

    def install(self):
        raise NotImplementedError("This module lacks an installer")

    def uninstall(self):
        raise NotImplementedError("This module lacks an installer")

    class Meta:
        unique_together=("volume", "ordering")
        abstract = True
