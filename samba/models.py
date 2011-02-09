# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib.auth.models import User
from django.db import models

from lvm.models import StatefulModel, LogicalVolume

class Share(StatefulModel):
    volume        = models.ForeignKey(LogicalVolume)
    available     = models.BooleanField(default=True,  blank=True)
    browseable    = models.BooleanField(default=True,  blank=True)
    guest_ok      = models.BooleanField(default=False, blank=True)
    writeable     = models.BooleanField(default=True,  blank=True)
    force_user    = models.CharField(max_length=50, blank=True)
    force_group   = models.CharField(max_length=50, blank=True)
    create_mode   = models.CharField(max_length=5,  default="0664")
    dir_mode      = models.CharField(max_length=5,  default="0775")
    comment       = models.CharField(max_length=250, blank=True)
    valid_users   = models.ManyToManyField(User, blank=True, related_name="valid_user_share_set"  )
    invalid_users = models.ManyToManyField(User, blank=True, related_name="invalid_user_share_set")
    read_list     = models.ManyToManyField(User, blank=True, related_name="read_user_share_set"   )
    write_list    = models.ManyToManyField(User, blank=True, related_name="write_user_share_set"  )

    share_type    = "samba"

    def __unicode__(self):
        return unicode(self.volume)

    @property
    def path(self):
        return self.volume.fs.mountpoint

    @property
    def valid_users_str(self):
        return ' '.join([rec["username"] for rec in self.valid_users.values("username")])

    @property
    def invalid_users_str(self):
        return ' '.join([rec["username"] for rec in self.invalid_users.values("username")])

    @property
    def read_list_str(self):
        return ' '.join([rec["username"] for rec in self.read_list.values("username")])

    @property
    def write_list_str(self):
        return ' '.join([rec["username"] for rec in self.write_list.values("username")])
