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

from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.utils.translation    import ugettext_lazy as _
from django.contrib.auth.models  import User

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices, capabilities, filesystems

class DeviceNotFound(Exception):
    pass


class CapabilitiesAwareManager(models.Manager):
    def filter_by_capability(self, capability):
        return self.extra(where=[self.model._meta.db_table + '.capflags & %s = %s'], params=[capability.flag, capability.flag])


class CapabilitiesAwareModel(models.Model):
    # TODO: This should probably be wrapped in a CapabilitiesField or something
    capflags    = models.BigIntegerField(default=0)

    objects     = CapabilitiesAwareManager()

    class Meta:
        abstract = True

    @property
    def capabilities(self):
        return capabilities.from_flags(self.capflags)

    @capabilities.setter
    def capabilities(self, value):
        self.capflags = capabilities.to_flags(value)


class VolumePool(CapabilitiesAwareModel):
    """ Something that joins a couple of BlockVolumes together. """
    volumepool_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volumepool_type_set")
    volumepool      = generic.GenericForeignKey("volumepool_type", "id")

    all_objects = models.Manager()

    # Interface:
    # name       -> CharField or property
    # type       -> CharField or property
    # megs       -> IntegerField or property
    # usedmegs   -> IntegerField or property
    # status     -> CharField or property
    # host       -> ForeignKey or property that returns the node this device resides on (or the primary for DRBD)

    @property
    def member_set(self):
        return BlockVolume.objects.filter(upper_type=ContentType.objects.get_for_model(self.volumepool.__class__), upper_id=self.id)

    def save(self, *args, **kwargs):
        if self.__class__ is not VolumePool:
            self.volumepool_type = ContentType.objects.get_for_model(self.__class__)
        return CapabilitiesAwareModel.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.volumepool.name


class AbstractVolume(CapabilitiesAwareModel):
    pool        = models.ForeignKey(VolumePool,  blank=True, null=True)
    volume_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volume_type_set")
    volume      = generic.GenericForeignKey("volume_type", "id")

    class Meta:
        abstract = True

    # Interface:
    # name       -> CharField or property
    # megs       -> IntegerField or property
    # disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
    # host       -> ForeignKey or property that returns the node this device resides on (or the primary for DRBD)


class BlockVolume(AbstractVolume):
    """ Everything that is a /dev/something. """
    upper_type  = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_upper_type_set")
    upper_id    = models.PositiveIntegerField(blank=True, null=True)
    upper       = generic.GenericForeignKey("upper_type", "upper_id")

    # Interface:
    # device -> CharField or property that returns /dev/path

    def save(self, *args, **kwargs):
        if self.__class__ is not BlockVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.volume.name


class GenericDisk(BlockVolume):
    """ A standard disk that is NOT anything fancy (like a hardware raid). """
    host        = models.ForeignKey(Host)
    serial      = models.CharField(max_length=150, blank=True)
    type        = models.CharField(max_length=50, choices=(("sata", "SATA"), ("sas", "SAS"), ("ssd", "SSD")), default="sas")
    rpm         = models.IntegerField(blank=True, null=True)

    @property
    def udev_device(self):
        import pyudev
        ctx = pyudev.Context()

        for dev in ctx.list_devices():
            if dev.subsystem != "block":
                continue
            if "ID_SCSI_SERIAL" in dev and dev["ID_SCSI_SERIAL"] == self.serial:
                return dev

        raise DeviceNotFound(self.serial)

    @property
    def device(self):
        return self.udev_device.device_node

    @property
    def name(self):
        return self.udev_device.sys_name

    @property
    def megs(self):
        return int(self.udev_device.attributes["size"]) * 512. / 1024. / 1024.

    @property
    def disk_stats( self ):
        """ Return disk stats from the LV retrieved from the kernel. """
        return blockdevices.get_disk_stats( self.name )

    def __unicode__(self):
        return "%s (%dMiB)" % (self.device, self.megs)


class FileSystemVolume(AbstractVolume):
    """ Everything that can be mounted as a /media/something and is supposed to be able to be shared. """
    filesystem  = models.CharField(max_length=50)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    # Interface:
    # see FileSystemProvider

    def save(self, *args, **kwargs):
        if self.__class__ is not FileSystemVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return unicode(self.volume)


class FileSystemProvider(FileSystemVolume):
    """ A FileSystem that resides on top of a BlockVolume. """
    base        = models.ForeignKey(BlockVolume)

    def save(self, *args, **kwargs):
        FileSystemVolume.save(self, *args, **kwargs)
        self.base.upper = self
        self.base.save()

    @property
    def fs(self):
        return filesystems.get_by_name(self.filesystem)(self.base)

    @property
    def fsname(self):
        return self.fs.fsname

    @property
    def mountpoint(self):
        return self.fs.mountpoint

    @property
    def mounthost(self):
        return self.fs.mounthost

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat

    def __unicode__(self):
        return unicode(self.base)


