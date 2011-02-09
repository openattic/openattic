# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib.auth.models import User
from django.db import models

from lvm.filesystems import FILESYSTEMS, get_by_name as get_fs_by_name
from lvm.procutils   import lvm_vgs, lvm_lvs

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
    state       = models.CharField(max_length=20, editable=False, default="new", choices=SETUP_STATE_CHOICES)

    def save(self, *args, **kwargs):
        if self.id is None:
            self.state = "new"
        elif self.state == "active":
            self.state = "update"
        elif self.state in ("pending", "delete", "dpend"):
            raise RuntimeError("Cannot save while in a pending state (installation running!)")
        return models.Model.save(self, *args, **kwargs)

    def set_active(self):
        if self.state != "pending":
            raise RuntimeError("Cannot transition from '%s' to 'active'" % self.state)
        self.state = "active"
        return models.Model.save(self)

    def set_pending(self):
        if self.state not in ("new", "update"):
            raise RuntimeError("Cannot transition from '%s' to 'pending'" % self.state)
        self.state = "pending"
        return models.Model.save(self)

    def set_dpend(self):
        if self.state != "delete":
            raise RuntimeError("Cannot transition from '%s' to 'dpend'" % self.state)
        self.state = "dpend"
        return models.Model.save(self)

    def set_done(self):
        if self.state != "dpend":
            raise RuntimeError("Cannot transition from '%s' to 'done'" % self.state)
        self.state = "done"
        return models.Model.save(self)

    def delete(self):
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
    name        = models.CharField(max_length=130, unique=True)

    def __unicode__(self):
        return self.name

    @property
    def lvm_info(self):
        return lvm_vgs()[self.name]

class LogicalVolume(StatefulModel):
    name        = models.CharField(max_length=130, unique=True)
    megs        = models.IntegerField()
    vg          = models.ForeignKey(VolumeGroup)
    snapshot    = models.ForeignKey("self", blank=True, null=True)
    filesystem  = models.CharField(max_length=20, blank=True, null=True,
                    choices=[(fs.name, fs.desc) for fs in FILESYSTEMS] )
    owner       = models.ForeignKey(User)

    def __init__( self, *args, **kwargs ):
        StatefulModel.__init__( self, *args, **kwargs )
        self._fs = None

    @property
    def path(self):
        return "/dev/%s/%s" % ( self.vg.name, self.name )

    @property
    def fs(self):
        if not self.filesystem:
            return None
        else:
            if self._fs is None:
                self._fs = get_fs_by_name(self.filesystem)(self)
            return self._fs

    def __unicode__(self):
        return self.name

    def get_shares( self, app_label=None ):
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if app_label  and relobj.model._meta.app_label != app_label:
                continue;

            for relmdl in relobj.model.objects.filter( **{ relobj.field.name: self } ):
                yield relmdl

    @property
    def lvm_info(self):
        if self.state not in ("active", "update", "pending"):
           return None
        return lvm_lvs()[self.name]

    @property
    def lvm_megs(self):
        return float(self.lvm_info["LVM2_LV_SIZE"][:-1])

    def delete(self):
        if self.state == "active":
            for share in self.get_shares():
                share.delete()
            StatefulModel.delete(self)
        elif self.state in ("new", "done"):
            for share in lv.get_shares():
                if share.state == "done":
                    share.delete()
                else:
                    return
            StatefulModel.delete(self)
        elif self.state == "delete":
            pass
        else:
            raise RuntimeError("Cannot transition from '%s' to 'delete'" % self.state)
