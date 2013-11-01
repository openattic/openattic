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

import os.path
import dbus

from django.db import models
from django.db.models import signals
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.utils.translation    import ugettext_lazy as _
from django.contrib.auth.models  import User

from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices, capabilities, filesystems


if "nagios" in settings.INSTALLED_APPS:
    HAVE_NAGIOS = True
    from nagios.models import Command, Service
    from nagios.conf import settings as nagios_settings
else:
    HAVE_NAGIOS = False


class DeviceNotFound(Exception):
    pass

class InvalidVolumeType(Exception):
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
    """ Something that joins a couple of BlockVolumes together and provides
        BlockVolumes or FileSystemVolumes itself.

        Classes that inherit from this one are required to implement the following properties:
        * name       -> CharField or property
        * type       -> CharField or property (to be displayed to the user)
        * megs       -> IntegerField or property
        * usedmegs   -> IntegerField or property
        * status     -> CharField or property
        * host       -> ForeignKey or property of a node that can modify the volumepool

        ...and the following methods:
        * get_volume_class(type) -> return the volume class to use for volumes of the given type
    """
    volumepool_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volumepool_type_set")
    volumepool      = generic.GenericForeignKey("volumepool_type", "id")

    all_objects = models.Manager()

    @property
    def member_set(self):
        return BlockVolume.objects.filter(upper_type=ContentType.objects.get_for_model(self.volumepool.__class__), upper_id=self.id)

    def get_volume_class(self, type):
        raise NotImplementedError("VolumePool::get_volume_class needs to be overridden")

    def save(self, *args, **kwargs):
        if self.__class__ is not VolumePool:
            self.volumepool_type = ContentType.objects.get_for_model(self.__class__)
        return CapabilitiesAwareModel.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.volumepool.name

    def create_volume(self, name, megs, owner, filesystem, fswarning, fscritical):
        """ Create a volume in this pool. """
        VolumeClass = self.get_volume_class(filesystem)
        vol_options = {"name": name, "megs": megs, "owner": owner, "pool": self}
        if issubclass(VolumeClass, FileSystemVolume):
            vol_options.update({"filesystem": filesystem, "fswarning": fswarning, "fscritical": fscritical})
        vol = VolumeClass(**vol_options)
        vol.full_clean()
        vol.save()

        if issubclass(VolumeClass, FileSystemVolume) and not bool(filesystem):
            # vol = imagedatei in dem ding
            pass
        elif issubclass(VolumeClass, BlockVolume) and bool(filesystem):
            vol = FileSystemProvider(base=vol, owner=owner, filesystem=filesystem,
                                     fswarning=fswarning, fscritical=fscritical)
            vol.full_clean()
            vol.save()

        return vol



class AbstractVolume(CapabilitiesAwareModel):
    """ Abstract base class for BlockVolume and FileSystemVolume. """
    pool        = models.ForeignKey(VolumePool,  blank=True, null=True)
    volume_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volume_type_set")
    volume      = generic.GenericForeignKey("volume_type", "id")

    class Meta:
        abstract = True


class BlockVolume(AbstractVolume):
    """ Everything that is a /dev/something.

        Classes that inherit from this one are required to implement the following properties:
        * name       -> CharField or property
        * type       -> CharField or property (to be displayed to the user)
        * megs       -> IntegerField or property
        * disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
        * host       -> ForeignKey or property of a node that can modify the volume
        * status     -> CharField or property
        * path       -> CharField or property that returns /dev/path

        Optionally, the following properties may be implemented:
        * raid_params > RAID layout information (chunk/stripe size etc)

        The ``upper'' field defined by this class is set to an object that is using this
        device as part of a mirror, array or volume pool (i.e., NOT a share).
    """
    upper_type  = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_upper_type_set")
    upper_id    = models.PositiveIntegerField(blank=True, null=True)
    upper       = generic.GenericForeignKey("upper_type", "upper_id")

    all_objects = models.Manager()

    @property
    def raid_params(self):
        raise blockdevices.UnsupportedRAID()

    def save(self, *args, **kwargs):
        if self.__class__ is not BlockVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.volume.name

    @property
    def disk_stats(self):
        """ Get disk stats from `/sys/block/X/stat'. """
        devname = os.path.realpath(self.path).replace("/dev/", "")
        if not os.path.exists( "/sys/block/%s/stat" % devname ):
            raise SystemError( "No such device: '%s'" % devname )

        fd = open("/sys/block/%s/stat" % devname, "rb")
        try:
            stats = fd.read().split()
        finally:
            fd.close()

        return dict( zip( [
            "reads_completed",  "reads_merged",  "sectors_read",    "millisecs_reading",
            "writes_completed", "writes_merged", "sectors_written", "millisecs_writing",
            "ios_in_progress",  "millisecs_in_io", "weighted_millisecs_in_io"
            ], [ int(num) for num in stats ] ) )


if HAVE_NAGIOS:
    def __create_service_for_blockvolume(instance, **kwargs):
        cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = nagios_settings.LV_PERF_DESCRIPTION % unicode(instance),
            arguments   = instance.path
        )
        srv.save()

    def __delete_service_for_blockvolume(instance, **kwargs):
        ctype = ContentType.objects.get_for_model(instance.__class__)
        for srv in Service.objects.filter(target_type=ctype, target_id=instance.id):
            srv.delete()

    def __connect_signals_for_blockvolume(sender, **kwargs):
        if issubclass(sender, BlockVolume):
            signals.post_save.connect(  __create_service_for_blockvolume, sender=sender)
            signals.post_delete.connect(__delete_service_for_blockvolume, sender=sender)

    signals.class_prepared.connect(__connect_signals_for_blockvolume)


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
    def status(self):
        return ""

    @property
    def path(self):
        return self.udev_device.device_node

    @property
    def name(self):
        return self.udev_device.sys_name

    @property
    def megs(self):
        return int(self.udev_device.attributes["size"]) * 512. / 1024. / 1024.

    def __unicode__(self):
        return "%s (%dMiB)" % (self.path, self.megs)


class FileSystemVolume(AbstractVolume):
    """ Everything that can be mounted as a /media/something and is supposed to be shared.

        Classes that inherit from this one are required to implement the following properties:
        * name       -> CharField or property
        * type       -> CharField or property (to be displayed to the user)
        * megs       -> IntegerField or property
        * host       -> ForeignKey or property of a node that can modify the volume
        * path       -> CharField or property that returns the mount point
        * disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
        * status     -> CharField or property
        * stat       -> property that returns { size:, free:, used: } in MiB
    """
    filesystem  = models.CharField(max_length=50)
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        if self.__class__ is not FileSystemVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return unicode(self.volume)

    @property
    def path(self):
        return self.volume.fs.path

    @property
    def type(self):
        return self.volume.fs.name


if HAVE_NAGIOS:
    def __create_service_for_filesystemvolume(instance, **kwargs):
        cmd = Command.objects.get(name=nagios_settings.LV_UTIL_CHECK_CMD)
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = nagios_settings.LV_UTIL_DESCRIPTION % unicode(instance),
            arguments   = instance.path
        )
        srv.save()

    def __delete_service_for_filesystemvolume(instance, **kwargs):
        ctype = ContentType.objects.get_for_model(instance.__class__)
        for srv in Service.objects.filter(target_type=ctype, target_id=instance.id):
            srv.delete()

    def __connect_signals_for_filesystemvolume(sender, **kwargs):
        if issubclass(sender, FileSystemVolume):
            signals.post_save.connect(  __create_service_for_blockvolume, sender=sender)
            signals.post_delete.connect(__delete_service_for_blockvolume, sender=sender)

    signals.class_prepared.connect(__connect_signals_for_filesystemvolume)



class FileSystemProvider(FileSystemVolume):
    """ A FileSystem that resides on top of a BlockVolume. """
    base        = models.ForeignKey(BlockVolume)

    all_objects = models.Manager()

    def setupfs( self ):
        sysd = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/")
        jid = sysd.build_job()
        self.fs.format()
        sysd.enqueue_job(jid)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        FileSystemVolume.save(self, *args, **kwargs)
        self.base.upper = self
        self.base.save()
        if install:
            self.setupfs()

    @property
    def name(self):
        return self.base.volume.name

    @property
    def status(self):
        return {True: "online", False: "offline"}[self.mounted]

    @property
    def megs(self):
        return self.base.volume.megs

    @property
    def host(self):
        return self.base.volume.host

    @property
    def disk_stats(self):
        return self.base.volume.disk_stats

    @property
    def fs(self):
        return filesystems.get_by_name(self.filesystem)(self)

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat

    def __unicode__(self):
        return unicode(self.base)


