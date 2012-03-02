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

from pwd import getpwnam
from grp import getgrnam

from django.db import models

from lvm.models import LogicalVolume

class Group(models.Model):
    groupname   = models.CharField( max_length=50, unique=True )
    gid         = models.IntegerField( unique=True )
    members     = models.CharField( max_length=50 )

class User(models.Model):
    volume      = models.ForeignKey(LogicalVolume, related_name="ftp_user_set")
    username    = models.CharField( max_length=50, unique=True )
    passwd      = models.CharField( max_length=50, blank=True, null=True )
    uid         = models.IntegerField(editable=False)
    gid         = models.IntegerField(editable=False)
    homedir     = models.CharField( max_length=500 )
    shell       = models.CharField( max_length=50, default="/bin/true" )

    share_type  = "ftp"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')
        for mp in self.volume.fs.mountpoints:
            if self.homedir.startswith(mp):
                return
        raise ValidationError('The homedir must be within the mount directory of the selected volume.')

    def save(self, *args, **kwargs):
        try:
            sysuser = getpwnam(self.volume.owner.username)
            self.uid = sysuser.pw_uid
            self.gid = sysuser.pw_gid
        except KeyError:
            self.uid = self.volume.owner.id + 2000
            try:
                self.gid = getgrnam("users").gr_gid
            except KeyError:
                self.gid = 100

        return models.Model.save(self, *args, **kwargs)

class FileLog(models.Model):
    username    = models.ForeignKey( User, to_field="username" )
    abspath     = models.CharField( max_length=500 )
    file        = models.CharField( max_length=500 )
    dns         = models.CharField( max_length=500 )
    transtime   = models.CharField( max_length=500 )
    rectime     = models.DateTimeField()
