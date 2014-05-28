# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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
import uuid

from django.db import models
from django.db.models import signals
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.utils.translation    import ugettext_lazy as _
from django.contrib.auth.models  import User
from django.core.exceptions      import ValidationError

from systemd import get_dbus_object, Transaction
from systemd.lockutils import Lockfile, AlreadyLocked
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices, capabilities, filesystems
from volumes import signals as volume_signals


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


class StorageObject(models.Model):
    """ A general object that may be just about anything.

        The StorageObject is a general entry point that collects all information
        about objects in one place, no matter if they are volume pools, block
        volumes or file system volumes.
    """
    name        = models.CharField(max_length=150)
    megs        = models.IntegerField()
    uuid        = models.CharField(max_length=38, editable=False)
    is_origin   = models.BooleanField(default=False)
    createdate  = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    # TODO: This should probably be wrapped in a CapabilitiesField or something
    capflags    = models.BigIntegerField(default=0)
    source_pool = models.ForeignKey('VolumePool', blank=True, null=True, related_name="volume_set")
    snapshot    = models.ForeignKey('self', blank=True, null=True, related_name="snapshot_storageobject_set")

    objects     = CapabilitiesAwareManager()
    all_objects = models.Manager()

    def full_clean(self):
        models.Model.full_clean(self)
        if not self.uuid:
            self.uuid = str(uuid.uuid4())

    @property
    def lockfile(self):
        return "/var/lock/openattic/volume-%s" % self.uuid

    def lock(self):
        if not self.uuid:
            self.uuid = str(uuid.uuid4())
        get_dbus_object("/").acquire_lock(self.lockfile)

    @property
    def is_locked(self):
        from systemd.lockutils import Lockfile
        try:
            with Lockfile(self.lockfile, 0):
                return False
        except AlreadyLocked:
            return True

    def wait(self, max_wait=600):
        from systemd.lockutils import Lockfile
        try:
            with Lockfile(self.lockfile, max_wait):
                return True
        except AlreadyLocked:
            return False

    @property
    def capabilities(self):
        return capabilities.from_flags(self.capflags)

    @capabilities.setter
    def capabilities(self, value):
        self.capflags = capabilities.to_flags(value)

    @property
    def volumepool_or_none(self):
        try:
            return self.volumepool.volumepool
        except VolumePool.DoesNotExist:
            return None

    @property
    def blockvolume_or_none(self):
        try:
            return self.blockvolume.volume
        except BlockVolume.DoesNotExist:
            return None

    @property
    def filesystemvolume_or_none(self):
        try:
            return self.filesystemvolume.volume
        except FileSystemVolume.DoesNotExist:
            return None

    @property
    def authoritative_obj(self):
        obj = self.volumepool_or_none or self.blockvolume_or_none or self.filesystemvolume_or_none
        if obj is not None:
            return obj
        raise ValueError("No authoritative object found for storageobj %d ('%s')" % (self.id, self.name))

    @property
    def host(self):
        return self.authoritative_obj.host

    def delete(self):
        """ Delete this StorageObject and any object associated with it. """
        with Transaction(background=False):
            self.lock()
            for obj in (self.filesystemvolume_or_none, self.volumepool_or_none, self.blockvolume_or_none):
                if obj is not None:
                    obj.delete()

            return models.Model.delete(self)

    def resize(self, megs):
        """ Resize everything to the given size. """
        oldmegs = self.megs
        newmegs = megs
        self.megs = newmegs
        self.save()

        objs = [self.blockvolume_or_none, self.volumepool_or_none, self.filesystemvolume_or_none]

        if oldmegs > newmegs:
            # if we're shrinking stuff, reverse the order
            objs.reverse()

        with Transaction():
            self.lock()
            for obj in objs:
                if obj is None:
                    continue
                if oldmegs > newmegs:
                    obj.shrink(oldmegs, newmegs)
                else:
                    obj.grow(oldmegs, newmegs)

    def create_volume(self, name, megs, options):
        """ If this is a Volume Pool, create a volume in it.

            Otherwise, raise NotImplementedError.
        """
        try:
            return self.volumepool.volumepool.create_volume(name, megs, options).storageobj
        except VolumePool.DoesNotExist:
            raise NotImplementedError("This object is not a volume pool, cannot create volumes in it")

    def create_snapshot(self, name, megs, options):
        """ If this is a volume that supports snapshots, snap it.

            Otherwise, raise NotImplementedError.
        """
        for obj in (self.filesystemvolume_or_none, self.blockvolume_or_none):
            if obj is not None:
                try:
                    vol = obj.create_snapshot(name, megs, options)
                except NotImplementedError:
                    pass
                else:
                    return vol.storageobj

        raise NotImplementedError("This volume cannot be snapshotted")

    def clone(self, target, options):
        """ If this is a block volume, clone it into the target.

            Otherwise, raise NotImplementedError.
        """
        try:
            return self.blockvolume.volume.clone(target, options)
        except BlockVolume.DoesNotExist:
            raise NotImplementedError("This volume cannot be cloned")

    def __unicode__(self):
        return self.name


class VolumePool(models.Model):
    """ Something that joins a couple of BlockVolumes together and provides
        BlockVolumes or FileSystemVolumes itself.

        Classes that inherit from this one are required to implement the following properties:
        * usedmegs   -> IntegerField or property
        * status     -> CharField or property
        * host       -> ForeignKey or property of a node that can modify the volumepool

        ...and the following methods:
        * _create_volume_for_storageobject(storageobj, options) -> create a volume for the given options in this pool
        * is_fs_supported(filesystem) -> return whether or not volumes with this file system can be created

        Valid values for the ``status'' field are:
          online, readonly, degraded, verifying, rebuilding, restoring_snapshot, failed, offline, unknown
    """
    storageobj  = models.OneToOneField(StorageObject)
    volumepool_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volumepool_type_set")
    volumepool      = generic.GenericForeignKey("volumepool_type", "id")

    objects     = getHostDependentManagerClass('volumepool__host')()
    all_objects = models.Manager()

    @property
    def member_set(self):
        """ The block devices that provide the storage for this volume pool. """
        return BlockVolume.objects.filter(upper=self.storageobj)

    def _create_volume_for_storageobject(self, storageobj, options):
        """ Create a volume that best fulfills the specification given
            in `options' and attach it to the passed storageobj.
        """
        raise NotImplementedError("VolumePool::_create_volume_for_storageobject needs to be overridden")

    def is_fs_supported(self, type):
        """ Check if we can create a volume with the given file system. """
        raise NotImplementedError("VolumePool::is_fs_supported needs to be overridden")

    def get_supported_filesystems(self):
        """ Get all file systems supported by this volume pool. """
        return [fs for fs in filesystems.FILESYSTEMS if self.is_fs_supported(fs)]

    def save(self, *args, **kwargs):
        if self.__class__ is not VolumePool:
            self.volumepool_type = ContentType.objects.get_for_model(self.__class__)
        return models.Model.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.storageobj.name

    def _create_volume(self, name, megs, options):
        """ Actual volume creation. """
        from django.core.exceptions import ValidationError
        storageobj = StorageObject(name=name, megs=megs, source_pool=self)
        storageobj.full_clean()
        storageobj.save()
        storageobj.lock()

        try:
            vol = self._create_volume_for_storageobject(storageobj, options)

            if isinstance(vol, FileSystemVolume) and not bool(options.get("filesystem", None)):
                # TODO: vol = imagedatei in dem ding
                pass
            elif isinstance(vol, BlockVolume) and bool(options.get("filesystem", None)):
                fsclass = filesystems.get_by_name(options["filesystem"])
                vol = fsclass.format_blockvolume(vol, options)
        except:
            from django.db import connection
            connection.connection.rollback()
            storageobj.delete()
            raise

        return vol

    def create_volume(self, name, megs, options):
        """ Create a volume in this pool.

            Options include:
             * filesystem: The filesystem the volume is supposed to have (if any).
             * owner:      The owner of the file system.
             * fswarning:  Warning Threshold for Nagios checks.
             * fscritical: Critical Threshold for Nagios checks.
        """
        with Transaction():
            return self._create_volume(name, megs, options)

    def grow(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support grow" % self.__class__)

    def shrink(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support shrink" % self.__class__)



class AbstractVolume(models.Model):
    """ Abstract base class for BlockVolume and FileSystemVolume. """
    storageobj  = models.OneToOneField(StorageObject)
    volume_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volume_type_set")
    volume      = generic.GenericForeignKey("volume_type", "id")

    class Meta:
        abstract = True

    def pre_install(self):
        volume_signals.pre_install.send(sender=self.__class__, instance=self)

    def post_install(self):
        volume_signals.post_install.send(sender=self.__class__, instance=self)

    def save(self, *args, **kwargs):
        install = (self.id is None)
        if install:
            self.pre_install()
        res = models.Model.save(self, *args, **kwargs)
        if install:
            self.post_install()

        return res

    def _create_snapshot_for_storageobject(self, storageobj, options):
        """ Create a volume that best fulfills the specification given
            in `options' and attach it to the passed storageobj.
        """
        raise NotImplementedError("%s does not support snapshots" % self.__class__)

    def _create_snapshot(self, name, megs, options):
        """ Actual snapshot creation. """
        sourcepool = self.storageobj.volumepool_or_none or self.storageobj.source_pool
        storageobj = StorageObject(snapshot=self.storageobj, name=name, megs=megs, source_pool=sourcepool)
        storageobj.full_clean()
        storageobj.save()
        storageobj.lock()
        self.storageobj.lock()

        try:
            vol = self._create_snapshot_for_storageobject(storageobj, options)

            if self.storageobj.filesystemvolume_or_none is not None and storageobj.filesystemvolume_or_none is None:
                # The origin has an FSV but the snapshot does not. if we have an FSP, this makes
                # sense; create a new one for the snapshot in this case.
                origin = self.storageobj.filesystemvolume_or_none.volume
                if not isinstance(origin, FileSystemProvider):
                    raise TypeError("Missing file system on snapshot of '%s': '%s'" % (unicode(self), unicode(storageobj)))
                snapfsp = FileSystemProvider(storageobj=storageobj, fstype=origin.fstype,
                                                fswarning=origin.fswarning, fscritical=origin.fscritical, owner=origin.owner)
                snapfsp.full_clean()
                snapfsp.save()
        except:
            from django.db import connection
            connection.connection.rollback()
            storageobj.delete()
            raise

        return vol

    def create_snapshot(self, name, megs, options):
        """ Create a snapshot of this volume. """
        with Transaction():
            return self._create_snapshot(name, megs, options)

    def grow(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support grow" % self.__class__)

    def shrink(self, oldmegs, newmegs):
        raise NotImplementedError("%s does not support shrink" % self.__class__)



class BlockVolume(AbstractVolume):
    """ Everything that is a /dev/something.

        Classes that inherit from this one are required to implement the following properties:
        * disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
        * host       -> ForeignKey or property of a node that can modify the volume
        * status     -> CharField or property
        * path       -> CharField or property that returns /dev/path

        Optionally, the following properties may be implemented:
        * raid_params > RAID layout information (chunk/stripe size etc)

        The ``upper'' field defined by this class is set to an object that is using this
        device as part of a mirror, array or volume pool (i.e., NOT a share).
    """
    upper       = models.ForeignKey(StorageObject, blank=True, null=True, related_name="base_set")

    objects     = getHostDependentManagerClass('volume__host')()
    all_objects = models.Manager()

    @property
    def raid_params(self):
        raise blockdevices.UnsupportedRAID()

    def save(self, *args, **kwargs):
        if self.__class__ is not BlockVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.storageobj.name

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

    def _clone_to_storageobj(self, target_storageobject, options):
        """ Clone this volume into the target_storageobject in a way that best
            fulfills the specification given in `options'.
        """
        get_dbus_object("/volumes").dd(self.volume.path, target_storageobject.blockvolume.volume.path)

    def _clone(self, target_storageobject, options):
        self.storageobj.lock()

        if target_storageobject is None:
            if self.storageobj.source_pool is None:
                raise NotImplementedError("This volume can only be cloned into existing targets.")
            target_volume = self.storageobj.source_pool.volumepool._create_volume(options["name"], self.storageobj.megs, {})
            target_storageobject = target_volume.storageobj
            # target_storageobject will be locked by _create_volume
        else:
            target_storageobject.lock()

        src_fsv = self.storageobj.filesystemvolume_or_none
        tgt_fsv = target_storageobject.filesystemvolume_or_none
        mount = False

        if src_fsv and src_fsv.mounted:
            src_fsv.fs.unmount()
            mount = True
        if tgt_fsv and tgt_fsv.mounted:
            tgt_fsv.fs.unmount()

        self._clone_to_storageobj(target_storageobject, options)

        if src_fsv:
            if tgt_fsv is None:
                if not isinstance(src_fsv, FileSystemProvider):
                    raise TypeError("Cannot clone a volume with a FileSystem of type '%s' inside" % type(src_fsv))
                tgt_fsv = FileSystemProvider(storageobj=target_storageobject, fstype=src_fsv.fstype,
                                             fswarning=src_fsv.fswarning, fscritical=src_fsv.fscritical, owner=src_fsv.owner)
                tgt_fsv.save_clone()
            if mount:
                # we need to use fsv.fs.mount here because fsv.mount only mounts if it
                # has to, which it finds out by checking whether or not the path is
                # a mountpoint, which it *is* because .unmount() has been deferred
                # in the systemd transaction and not yet executed.
                src_fsv.fs.mount()
                tgt_fsv.fs.mount()

        return target_storageobject

    def clone(self, target_storageobject, options):
        """ Clone this volume into the given target. """
        with Transaction():
            return self._clone(target_storageobject, options)


if HAVE_NAGIOS:
    def __create_service_for_blockvolume(instance, **kwargs):
        cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
        ctype = ContentType.objects.get_for_model(instance.__class__)
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count() != 0:
            return
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
            volume_signals.post_install.connect(  __create_service_for_blockvolume, sender=sender)
            signals.post_delete.connect(__delete_service_for_blockvolume, sender=sender)

    signals.class_prepared.connect(__connect_signals_for_blockvolume)


class GenericDisk(BlockVolume):
    """ A standard disk that is NOT anything fancy (like a hardware raid). """
    host        = models.ForeignKey(Host)
    serial      = models.CharField(max_length=150, blank=True)
    type        = models.CharField(max_length=150, blank=True)
    rpm         = models.IntegerField(blank=True, null=True)

    def full_clean(self):
        BlockVolume.full_clean(self)
        if self.type not in ("sata", "sas", "ssd"):
            raise ValidationError({"type": ["Type needs to be one of 'sata', 'sas', 'ssd'."]})

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
        if self.storageobj.is_locked:
            return "locked"
        return "unknown"

    @property
    def path(self):
        return self.udev_device.device_node

    def __unicode__(self):
        return "%s (%dMiB)" % (self.path, self.storageobj.megs)


class FileSystemVolume(AbstractVolume):
    """ Everything that can be mounted as a /media/something and is supposed to be shared.

        Classes that inherit from this one are required to implement the following properties:
        * host       -> ForeignKey or property of a node that can modify the volume
        * path       -> CharField or property that returns the mount point
        * disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
        * status     -> CharField or property
        * stat       -> property that returns { size:, free:, used: } in MiB
    """
    owner       = models.ForeignKey(User, blank=True)
    fswarning   = models.IntegerField(_("Warning Level (%)"),  default=75 )
    fscritical  = models.IntegerField(_("Critical Level (%)"), default=85 )

    objects     = getHostDependentManagerClass('volume__host')()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        if self.__class__ is not FileSystemVolume:
            self.volume_type = ContentType.objects.get_for_model(self.__class__)
        return AbstractVolume.save(self, *args, **kwargs)

    def __unicode__(self):
        return self.storageobj.name

    @property
    def path(self):
        return self.volume.fs.path

    def mount(self):
        # TODO: this check should probably be moved to the systemapi.
        if not self.volume.fs.mounted:
            with Transaction(background=False):
                self.storageobj.lock()
                self.volume.fs.mount()

    def unmount(self):
        # TODO: this check should probably be moved to the systemapi.
        if self.volume.fs.mounted:
            with Transaction(background=False):
                self.storageobj.lock()
                self.volume.fs.unmount()


if HAVE_NAGIOS:
    def __create_service_for_filesystemvolume(instance, **kwargs):
        ctype = ContentType.objects.get_for_model(instance.__class__)
        cmd = Command.objects.get(name=nagios_settings.LV_UTIL_CHECK_CMD)
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count() != 0:
            return
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = nagios_settings.LV_UTIL_DESCRIPTION % unicode(instance),
            arguments   = "%d%%!%d%%!%s" % (100 - instance.fswarning, 100 - instance.fscritical, instance.path)
        )
        srv.save()

    def __delete_service_for_filesystemvolume(instance, **kwargs):
        ctype = ContentType.objects.get_for_model(instance.__class__)
        for srv in Service.objects.filter(target_type=ctype, target_id=instance.id):
            srv.delete()

    def __connect_signals_for_filesystemvolume(sender, **kwargs):
        if issubclass(sender, FileSystemVolume):
            volume_signals.post_install.connect(  __create_service_for_filesystemvolume, sender=sender)
            signals.post_delete.connect(__delete_service_for_filesystemvolume, sender=sender)

    signals.class_prepared.connect(__connect_signals_for_filesystemvolume)



class FileSystemProvider(FileSystemVolume):
    """ A FileSystem that resides on top of a BlockVolume. """
    fstype      = models.CharField(max_length=100)

    objects     = getHostDependentManagerClass('storageobj__host')()
    all_objects = models.Manager()

    def save(self, *args, **kwargs):
        install = (self.id is None)
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            if self.storageobj.snapshot is None:
                self.fs.format()
            else:
                self.fs.mount()

    def save_clone(self, *args, **kwargs):
        if self.id is not None:
            raise ValueError("Cannot save an already saved object as a clone")
        FileSystemVolume.save(self, *args, **kwargs)
        self.fs.set_uuid(generate=True)
        self.fs.write_fstab()

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        return {True: "online", False: "offline"}[self.mounted]

    @property
    def host(self):
        return self.storageobj.blockvolume.volume.host

    @property
    def disk_stats(self):
        return self.storageobj.blockvolume.volume.disk_stats

    @property
    def fs(self):
        return filesystems.get_by_name(self.fstype)(self)

    @property
    def mounted(self):
        return self.fs.mounted

    @property
    def stat(self):
        return self.fs.stat

    def __unicode__(self):
        return self.storageobj.name

    def grow(self, oldmegs, newmegs):
        return self.fs.grow(oldmegs, newmegs)

    def shrink(self, oldmegs, newmegs):
        return self.fs.grow(oldmegs, newmegs)


def __delete_filesystemprovider(instance, **kwargs):
    instance.fs.unmount()

signals.pre_delete.connect(__delete_filesystemprovider, sender=FileSystemProvider)
