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

from os.path import join, exists
from os import makedirs

from django.db import models
from django.conf import settings

from ftp.conf import settings as ftp_settings
from ifconfig.models import getHostDependentManagerClass
from django.contrib.auth.models import User
from lvm.models import LogicalVolume
import lvm.signals as lvm_signals


class Export(models.Model):
    volume      = models.ForeignKey(LogicalVolume, related_name="ftp_user_set")
    path        = models.CharField(max_length=255, blank=True) # TODO: not used yet
    user        = models.ForeignKey(User)

    objects     = getHostDependentManagerClass("volume__vg__host")()
    all_objects = models.Manager()

    share_type  = "ftp"

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.volume.filesystem:
            raise ValidationError('This share type can only be used on volumes with a file system.')

    def install(self):
        voldir = join(ftp_settings.HOMESDIR, self.user.username, self.volume.vg.name, self.volume.name)
        if not exists( voldir ):
            makedirs( voldir )
            lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
            lvm.fs_chown(-1, join(ftp_settings.HOMESDIR, self.user.username), self.user.username, "users")
            lvm.fs_chown(-1, join(ftp_settings.HOMESDIR, self.user.username, self.volume.vg.name), self.user.username, "users")
        self.volume.mount(voldir)

    def uninstall(self):
        voldir = join(ftp_settings.HOMESDIR, self.user.username, self.volume.vg.name, self.volume.name)
        self.volume.unmount(voldir)

    def save(self, *args, **kwargs):
        ret = models.Model.save(self, *args, **kwargs)
        self.install()
        return ret

    def delete(self):
        self.uninstall()
        return models.Model.delete(self)


class FileLog(models.Model):
    username    = models.ForeignKey( User, to_field="username" )
    abspath     = models.CharField( max_length=500 )
    file        = models.CharField( max_length=500 )
    dns         = models.CharField( max_length=500 )
    transtime   = models.CharField( max_length=500 )
    rectime     = models.DateTimeField()


def post_mount(sender, **kwargs):
    if kwargs["mountpoint"] == sender.mountpoints[0]:
        for exp in Export.objects.filter(volume=sender):
            exp.install()

def pre_unmount(sender, **kwargs):
    if kwargs["mountpoint"] == sender.mountpoints[0]:
        for exp in Export.objects.filter(volume=sender):
            exp.uninstall()

lvm_signals.post_mount.connect(post_mount)
lvm_signals.pre_unmount.connect(pre_unmount)
