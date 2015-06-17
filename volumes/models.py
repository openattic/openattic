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

from __future__ import division

import os
import os.path
import uuid
import operator

from datetime import datetime, timedelta

from django.db import models
from django.db.models import signals
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.utils.translation    import ugettext_lazy as _, ugettext_noop
from django.utils.timezone       import make_aware, get_default_timezone
from django.contrib.auth.models  import User
from django.core.exceptions      import ValidationError
from django.core.cache           import get_cache

from systemd import get_dbus_object
from systemd.helpers import Transaction
from systemd.lockutils import Lockfile, AlreadyLocked
from ifconfig.models import Host, HostDependentManager, getHostDependentManagerClass
from volumes import blockdevices, capabilities, filesystems
from volumes import signals as volume_signals


def _opNone(operator, *args):
    if len(args) > 2:
        arg1 = args[0]
        return _opNone(operator, arg1, _opNone(operator, *args[1:]))
    arg1, arg2 = args
    if arg1 is not None and arg2 is not None:
        return operator(arg1, arg2)
    return None


if "nagios" in settings.INSTALLED_APPS:
    HAVE_NAGIOS = True
    from nagios.models import Command, Service
    from nagios.conf import settings as nagios_settings
else:
    HAVE_NAGIOS = False


def _to_number_with_unit(value, unit="B", base=1024):
    """ Try to convert the given value to a number string like 14MiB. """
    if value is None:
        return None
    mult = ['M', 'G', 'T', 'P', 'E']
    for exp, facunit in enumerate(mult):
        factor = base ** exp
        divided = value / factor
        if 1 <= divided < base:
            value = divided
            unit = facunit + unit
            break
    try:
        return "{:,.2f}{:}".format(value, unit)
    except (AttributeError, ValueError): # python 2.5 and 2.6 respectively
        return str(value) + unit




class DeviceNotFound(Exception):
    pass

class InvalidVolumeType(Exception):
    pass

class CapabilitiesAwareManager(models.Manager):
    def filter_by_capability(self, capability):
        return self.extra(where=[self.model._meta.db_table + '.capflags & %s = %s'], params=[capability.flag, capability.flag])


STORAGEOBJECT_STATUS_CHOICES = (
    ("",     ugettext_noop("The status is unknown.")),
    ("good", ugettext_noop("Everything seems to be in order")),
    ("warn", ugettext_noop("An error might occur soon")),
    ("crit", ugettext_noop("An error has occurred, but the volume can be recovered")),
    ("fail", ugettext_noop("The object is broken and cannot be recovered")),
    )

STORAGEOBJECT_STATUS_FLAGS = {
    "unknown":       {"severity": -1, "desc": ugettext_noop("The status cannot be checked and is therefore unknown.")},
    "online":        {"severity":  0, "desc": ugettext_noop("The volume is accessible.")},
    "readonly":      {"severity":  0, "desc": ugettext_noop("The volume cannot be written to.")},
    "offline":       {"severity":  0, "desc": ugettext_noop("The volume is inaccessible.")},
    "creating":      {"severity":  0, "desc": ugettext_noop("The volume is being created.")},
    "initializing":  {"severity":  0, "desc": ugettext_noop("The storage device is initializing the volume.")},
    "verifying":     {"severity":  0, "desc": ugettext_noop("The storage device is verifying the volume's integrity.")},
    "primary":       {"severity":  0, "desc": ugettext_noop("The volume is in Primary mode.")},
    "secondary":     {"severity":  0, "desc": ugettext_noop("The volume is in Secondary mode.")},
    "rebuilding":    {"severity":  1, "desc": ugettext_noop("The storage device is rebuilding data.")},
    "degraded":      {"severity":  2, "desc": ugettext_noop("A storage device has failed and needs to be replaced.")},
    "failed":        {"severity":  3, "desc": ugettext_noop("The volume has failed and cannot be recovered.")},
    "nearfull":      {"severity":  1, "desc": ugettext_noop("The volume is nearly full.")},
    "highload":      {"severity":  1, "desc": ugettext_noop("The volume is experiencing high load.")},
    "highlatency":   {"severity":  1, "desc": ugettext_noop("Write operations take a long time to complete. Consider using a battery-backed-up hardware cache or faster disks.")},
    "randomio":      {"severity":  1, "desc": ugettext_noop("The workload is mostly random. Consider tuning the application to reduce the amount of random IO operations.")},
    }

CATALOGS = {
    'blockvolume':         [],
    'filesystemvolume':    [],
    'volumepool':          [],
    'physicalblockdevice': []
}



class StorageObject(models.Model):
    """ A general object that may be just about anything.

        The StorageObject is a general entry point that collects all information
        about objects in one place, no matter if they are volume pools, block
        volumes or file system volumes.

        StorageObjects can be used as Context Guards when creating new objects,
        like so:

            with StorageObject(name="herp", megs=1338) as so:
                thing = Thing(storageobj=so)
                thing.full_clean()
                thing.save()
                thing.doThings()

        In case any one of the operations inside the with: block fails, so._delete()
        will be called by the context guard automatically.

        The ``upper'' field defined by this class is set to an object that is using this
        device as part of a mirror, array or volume pool (i.e., NOT a share).
    """
    name            = models.CharField(max_length=150)
    megs            = models.IntegerField()
    uuid            = models.CharField(max_length=38, editable=False)
    is_origin       = models.BooleanField(default=False)
    createdate      = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    # TODO: This should probably be wrapped in a CapabilitiesField or something
    capflags        = models.BigIntegerField(default=0)
    source_pool     = models.ForeignKey('VolumePool', blank=True, null=True, related_name="volume_set")
    snapshot        = models.ForeignKey('self', blank=True, null=True, related_name="snapshot_storageobject_set")
    upper           = models.ForeignKey('self', blank=True, null=True, related_name="base_set")
    is_protected    = models.BooleanField(default=False)

    objects     = CapabilitiesAwareManager()
    all_objects = models.Manager()

    def full_clean(self, exclude=None, validate_unique=True):
        models.Model.full_clean(self, exclude=exclude, validate_unique=validate_unique)
        if not self.uuid:
            self.uuid = str(uuid.uuid4())

    def __enter__(self):
        if self.id is not None:
            raise ValueError("cannot use existing StorageObjects as a Context Guard")
        self.full_clean()
        self.save()
        return self

    def __exit__(self, type, value, traceback):
        if type is not None:
            # some exception occurred
            from django.db import connection
            connection.connection.rollback()
            self._delete()

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
    def physicalblockdevice_or_none(self):
        try:
            return self.physicalblockdevice.device
        except PhysicalBlockDevice.DoesNotExist:
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
            self._delete()

    def _delete(self):
        self.lock()
        for snap in self.snapshot_storageobject_set.all():
            snap._delete()
        for obj in (self.filesystemvolume_or_none, self.volumepool_or_none, self.blockvolume_or_none):
            if obj is not None:
                obj.delete()

        return models.Model.delete(self)

    def resize(self, megs):
        with Transaction():
            self._resize(megs)

    def _resize(self, megs):
        """ Resize everything to the given size. """
        from django.core.exceptions import ValidationError
        if megs < 100:
            raise ValidationError({"megs": ["Volumes need to be at least 100MB in size."]})

        oldmegs = self.megs
        newmegs = megs
        self.megs = newmegs
        self.save()

        objs = [self.blockvolume_or_none, self.volumepool_or_none, self.filesystemvolume_or_none]

        if oldmegs > newmegs:
            # if we're shrinking stuff, reverse the order
            objs.reverse()

        self.lock()
        for obj in objs:
            if obj is None:
                continue
            if oldmegs > newmegs:
                obj.shrink(oldmegs, newmegs)
            else:
                obj.grow(oldmegs, newmegs)
        objs.reverse()
        for obj in objs:
            if obj is None:
                continue
            if oldmegs > newmegs:
                obj.post_shrink(oldmegs, newmegs)
            else:
                obj.post_grow(oldmegs, newmegs)

    def create_volume(self, name, megs, options):
        """ If this is a Volume Pool, create a volume in it.

            Otherwise, raise NotImplementedError.
        """
        try:
            return self.volumepool.volumepool.create_volume(name, megs, options).storageobj
        except VolumePool.DoesNotExist:
            raise NotImplementedError("This object is not a volume pool, cannot create volumes in it")

    def create_filesystem(self, fstype, options):
        """ If this is a block volume, format it with the given fstype.

            Otherwise, raise NotImplementedError.
        """
        try:
            return self.blockvolume.volume.create_filesystem(fstype, options).storageobj
        except BlockVolume.DoesNotExist:
            raise NotImplementedError("This volume cannot be formatted")

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


    def get_volume_usage(self):
        stats = {
            "db_megs":  self.megs,
            "fs_megs":  None,
            "fs_used":  None,
            "fs_free":  float("inf"),
            "bd_megs":  None,
            "bd_used":  None,
            "bd_free":  float("inf"),
            "steal":       0,
            "used":     None,
            "free":     float("inf")
        }

        for obj in [self.blockvolume_or_none, self.filesystemvolume_or_none]:
            if obj is not None:
                obj.get_volume_usage(stats)

        return self._mkstats(stats)


    def get_volumepool_usage(self):
        stats = {
            "db_megs":  self.megs,
            "vp_megs":  None,
            "vp_used":  None,
            "vp_free":  float("inf"),
            "bd_megs":  None,
            "bd_used":  None,
            "bd_free":  float("inf"),
            "steal":       0,
            "used":     None,
            "free":     float("inf")
        }

        if self.blockvolume_or_none is not None:
            self.blockvolume_or_none.get_volume_usage(stats)
        if self.volumepool_or_none is not None:
            self.volumepool_or_none.get_volumepool_usage(stats)

        return self._mkstats(stats)

    def get_size(self):
        return {
            "size":      self.megs,
            "size_text": _to_number_with_unit(self.megs)
        }

    def _mkstats(self, stats):
        if stats["used"] is None or stats["free"] == float("inf"):
            return {
                "size":      self.megs,
                "size_text": _to_number_with_unit(self.megs)
            }

        _stats = {
            "steal":       stats["steal"],
            "used":        stats["used"],
            "free":        stats["free"],
            "usable":      _opNone(operator.add, stats["used"], stats["free"]),
            "size":        _opNone(operator.add, stats["used"], stats["free"], stats["steal"]),
            "used_pcnt":   _opNone(operator.mul, _opNone(operator.div, stats["used"], _opNone(operator.add, stats["used"], stats["free"])), 100.)
        }
        _stats.update({
            "used_text":   _to_number_with_unit(_stats["used"]),
            "free_text":   _to_number_with_unit(_stats["free"]),
            "steal_text":  _to_number_with_unit(_stats["steal"]),
            "usable_text": _to_number_with_unit(_stats["usable"]),
            "size_text":   _to_number_with_unit(_stats["size"]),
        })
        if "vp_max_new_fsv" in stats:
            _stats.update({
                "max_new_fsv":      stats["vp_max_new_fsv"],
                "max_new_fsv_text": _to_number_with_unit(stats["vp_max_new_fsv"]),
                "max_new_bv":       stats["vp_max_new_bv"],
                "max_new_bv_text":  _to_number_with_unit(stats["vp_max_new_bv"]),
            })
        return _stats

    def _get_status(self):
        cache = get_cache("status")
        ckey  = "storageobject__status__%d" % self.id

        flags = cache.get(ckey)
        if flags is not None and isinstance(flags, set):
            return flags

        flags = set()

        for obj in self.base_set.all():
            flags = flags.union(obj._get_status())

        for obj in (self.blockvolume_or_none, self.volumepool_or_none, self.filesystemvolume_or_none):
            if obj is not None:
                flags = flags.union(obj.get_status())

        if self.blockvolume_or_none is not None:
            pd = self.blockvolume_or_none.perfdata
            if pd is not None:
                if pd["load"] > 30:
                    flags.add("highload")
                if pd["latency_write"] > 0.010: # > 10ms
                    flags.add("highlatency")
                if pd["iops_write"] and pd["reqsz_write"] < 32 * 1024: # <32KiB
                    flags.add("randomio")

        if self.filesystemvolume_or_none is not None:
            if self.get_volume_usage().get("used_pcnt", 0) >= self.filesystemvolume_or_none.fscritical:
                flags.add("nearfull")

        cache.set(ckey, flags, 300)

        return flags

    def get_status(self):
        if self.is_locked:
            return {
                "status": "locked",
                "text":   ugettext_noop("The volume is locked."),
                "flags": {}
            }

        flags = self._get_status()

        maxseverity = -1
        for flag in flags:
            maxseverity = max(STORAGEOBJECT_STATUS_FLAGS[flag]["severity"], maxseverity)

        return {
            "status": STORAGEOBJECT_STATUS_CHOICES[maxseverity + 1][0],
            "text":   STORAGEOBJECT_STATUS_CHOICES[maxseverity + 1][1],
            "flags":  dict([ (flag, STORAGEOBJECT_STATUS_FLAGS[flag]["desc"]) for flag in flags ])
        }

    def get_storage_devices(self):
        for obj in (self.filesystemvolume_or_none, self.volumepool_or_none, self.blockvolume_or_none):
            if obj is not None:
                qryset = obj.get_storage_devices()
                if qryset is not None:
                    return qryset
        return []


def create_volumepool(blockvolumes, options):
    for PoolClass in CATALOG['volumepool']:
        if PoolClass.create_volumepool(blockvolumes, options):
            break
    else:
        raise NotImplementedError("No volumepool wanted to do that, y'know")


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
        return self.storageobj.base_set.all()

    def get_storage_devices(self):
        return [so.blockvolume_or_none for so in self.storageobj.base_set.all()]

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

    @property
    def usedmegs(self):
        return self.volumepool.usedmegs

    @property
    def freemegs(self):
        if self.usedmegs is None:
            return None
        return self.storageobj.megs - self.usedmegs

    def __unicode__(self):
        return self.storageobj.name

    def _create_volume(self, name, megs, options):
        """ Actual volume creation. """
        from django.core.exceptions import ValidationError
        if megs < 100:
            raise ValidationError({"megs": ["Volumes need to be at least 100MB in size."]})

        is_protected = options.pop('is_protected', False)

        storageobj = StorageObject(name=name, megs=megs, source_pool=self, is_protected=is_protected)
        storageobj.full_clean()
        storageobj.save()
        storageobj.lock()

        try:
            vol = self._create_volume_for_storageobject(storageobj, options)

            if isinstance(vol, FileSystemVolume) and not bool(options.get("filesystem", None)):
                # TODO: vol = imagedatei in dem ding
                pass
            elif isinstance(vol, BlockVolume) and bool(options.get("filesystem", None)):
                options = options.copy()
                fstype = options.pop("filesystem")
                vol = vol._create_filesystem(fstype, options)
        except:
            from django.db import connection
            connection.connection.rollback()
            storageobj._delete()
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

    def post_grow(self, oldmegs, newmegs):
        pass

    def post_shrink(self, oldmegs, newmegs):
        pass



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

    def get_storage_devices(self):
        return [self.storageobj.source_pool.volumepool]

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
            storageobj._delete()
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

    def post_grow(self, oldmegs, newmegs):
        pass

    def post_shrink(self, oldmegs, newmegs):
        pass



class BlockVolume(AbstractVolume):
    """ Everything that is a /dev/something.

        Classes that inherit from this one are required to implement the following properties:
        * disk_stats -> property that returns the current Kernel disk stats from /sys/block/sdX/stat as a dict
        * host       -> ForeignKey or property of a node that can modify the volume
        * status     -> CharField or property
        * path       -> CharField or property that returns /dev/path

        Optionally, the following properties may be implemented:
        * raid_params > RAID layout information (chunk/stripe size etc)
    """
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

    def _create_filesystem(self, fstype, options):
        fsclass = filesystems.get_by_name(fstype)
        return fsclass.format_blockvolume(self, options)

    def create_filesystem(self, fstype, options):
        """ Format this volume. """
        with Transaction():
            self.storageobj.lock()
            return self._create_filesystem(fstype, options)

    def _clone_to_storageobj(self, target_storageobject, options):
        """ Clone this volume into the target_storageobject in a way that best
            fulfills the specification given in `options'.
        """
        if target_storageobject.megs < self.volume.storageobj.megs:
            raise ValueError("target volume is too small")
        get_dbus_object("/volumes").dd(self.volume.path, target_storageobject.blockvolume.volume.path, self.volume.storageobj.megs, "1M")

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
            if not isinstance(src_fsv, FileSystemProvider):
                raise TypeError("Cannot clone a volume with a FileSystem of type '%s' inside" % type(src_fsv))

            if tgt_fsv is None:
                tgt_fsv = FileSystemProvider(storageobj=target_storageobject, fstype=src_fsv.fstype,
                                             fswarning=src_fsv.fswarning, fscritical=src_fsv.fscritical, owner=src_fsv.owner)
            else:
                tgt_fsv.fstype     = src_fsv.fstype
                tgt_fsv.fswarning  = src_fsv.fswarning
                tgt_fsv.fscritical = src_fsv.fscritical
                tgt_fsv.owner      = src_fsv.owner

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

    @property
    def perfdata(self):
        if not HAVE_NAGIOS:
            return None
        cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
        try:
            serv = Service.objects.get(command=cmd, target_type=self.volume_type, target_id=self.id)
        except Service.DoesNotExist:
            return None
        if serv.last_check is None:
            # service has never been checked
            return None
        if make_aware(datetime.now(), get_default_timezone()) - serv.last_check > timedelta(minutes=15):
            # perfdata is outdated
            return None
        pd = serv.perfdata
        if not pd:
            # perfdata not yet processed by nagios, so the value is empty
            return None
        return {
            "load":            pd["load_percent"]["curr"],
            "bps_read":        pd["rd_bps"]["curr"],
            "bps_write":       pd["wr_bps"]["curr"],
            "tbpd_read":       pd["rd_bps"]["curr"] * 86400 / 1024**4,
            "tbpd_write":      pd["wr_bps"]["curr"] * 86400 / 1024**4,
            "iops_read":       pd["rd_iops"]["curr"],
            "iops_write":      pd["wr_iops"]["curr"],
            "reqsz_read":      pd["rd_avg_size"]["curr"],
            "reqsz_write":     pd["wr_avg_size"]["curr"],
            "latency_read":    pd["rd_avg_wait"]["curr"],
            "latency_write":   pd["wr_avg_wait"]["curr"],
            "normratio_read":  pd["rd_avg_size"]["curr"] / 4096,
            "normratio_write": pd["wr_avg_size"]["curr"] / 4096,
            "normiops_read":   pd["rd_avg_size"]["curr"] / 4096 * pd["rd_iops"]["curr"],
            "normiops_write":  pd["wr_avg_size"]["curr"] / 4096 * pd["wr_iops"]["curr"],
            }

    def detect_fs(self):
        typestring = get_dbus_object("/volumes").get_type(self.path)
        detected_fs = None
        for fs in filesystems.FILESYSTEMS:
            if fs.check_type(typestring):
                detected_fs = fs
                break
        else:
            return None
        fs.configure_blockvolume(self)
        return fs


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

    @property
    def usedmegs(self):
        return self.volume.fs.stat["used"]

    @property
    def freemegs(self):
        if self.usedmegs is None:
            return None
        return self.storageobj.megs - self.usedmegs

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
            arguments   = instance.storageobj.uuid
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


class PhysicalBlockDevice(models.Model):
    """ Base class for physical block devices.
    """
    storageobj  = models.OneToOneField(StorageObject)
    device_type = models.ForeignKey(ContentType, blank=True, null=True, related_name="%(class)s_volume_type_set")
    device      = generic.GenericForeignKey("device_type", "id")

    def save(self, *args, **kwargs):
        if self.__class__ is not PhysicalBlockDevice:
            self.device_type = ContentType.objects.get_for_model(self.__class__)
        return models.Model.save(self, *args, **kwargs)


def __add_to_catalogs(sender, **kwargs):
    if issubclass(sender, BlockVolume):
        CATALOGS['blockvolume'].append(sender)
    if issubclass(sender, FileSystemVolume):
        CATALOGS['filesystemvolume'].append(sender)
    if issubclass(sender, VolumePool):
        CATALOGS['volumepool'].append(sender)
    if issubclass(sender, PhysicalBlockDevice):
        CATALOGS['physicalblockdevice'].append(sender)

signals.class_prepared.connect(__add_to_catalogs)




class FileSystemProvider(FileSystemVolume):
    """ A FileSystem that resides on top of a BlockVolume. """
    fstype      = models.CharField(max_length=100)

    objects     = getHostDependentManagerClass('storageobj__host')()
    all_objects = models.Manager()

    def save(self, database_only=False, *args, **kwargs):
        install = (self.id is None and not database_only)
        FileSystemVolume.save(self, *args, **kwargs)
        if install:
            if self.storageobj.snapshot is None:
                self.fs.format()
            else:
                self.fs.mount()

    def save_clone(self, *args, **kwargs):
        FileSystemVolume.save(self, *args, **kwargs)
        self.fs.set_uuid(generate=True)
        self.fs.write_fstab()

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        return {True: "online", False: "offline"}[self.mounted]

    def get_status(self):
        if self.mounted:
            return ["online"]
        else:
            return ["offline"]

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
        return self.fs.shrink(oldmegs, newmegs)

    def post_grow(self, oldmegs, newmegs):
        return self.fs.post_grow(oldmegs, newmegs)

    def post_shrink(self, oldmegs, newmegs):
        return self.fs.post_shrink(oldmegs, newmegs)

    def get_volume_usage(self, stats):
        stats["fs_megs"] = self.storageobj.megs
        fs_stat = self.fs.stat
        if fs_stat["used"] is not None and fs_stat["free"] is not None:
            stats["fs_used"] = fs_stat["used"]
            stats["fs_free"] = fs_stat["free"]

        stats["used"]  = max(stats.get("used", None),         stats["fs_used"])
        stats["free"]  = min(stats.get("free", float("inf")), stats["fs_free"])

        return stats

def __delete_filesystemprovider(instance, **kwargs):
    instance.fs.unmount()

signals.pre_delete.connect(__delete_filesystemprovider, sender=FileSystemProvider)


class DiskDevice(PhysicalBlockDevice):
    """ The physical view of a standard disk (hence, PhysicalBlockDevice). """
    host        = models.ForeignKey(Host)
    model       = models.CharField(max_length=150, blank=True)
    serial      = models.CharField(max_length=150, blank=True)
    type        = models.CharField(max_length=150, blank=True)
    rpm         = models.IntegerField(blank=True, null=True)

    def full_clean(self, exclude=None, validate_unique=True):
        PhysicalBlockDevice.full_clean(self, exclude=exclude, validate_unique=validate_unique)
        if self.type not in ("SATA", "SAS", "SSD"):
            raise ValidationError({"type": ["Type needs to be one of 'SATA', 'SAS', 'SSD'."]})

    @property
    def udev_device(self):
        import pyudev
        ctx = pyudev.Context()

        for dev in ctx.list_devices():
            if dev.subsystem != "block":
                continue
            for attr in ("ID_SCSI_SERIAL", "ID_SERIAL_SHORT", "ID_SERIAL"):
                if attr in dev and dev[attr].strip("\0") == self.serial:
                    return dev

        raise DeviceNotFound(self.serial)

    @property
    def path(self):
        return self.udev_device.device_node

    @property
    def enclslot(self):
        for key in self.udev_device.parent.attributes.keys():
            if key.startswith("enclosure_device:Slot"):
                return int(key.split()[1])

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        return "unknown"

    def get_status(self):
        return [self.status]

    def set_identify(self, state):
        identify_path = os.path.join(self.udev_device.sys_path, "device",
                                     "enclosure_device:Slot %02d" % self.enclslot, "locate")
        if os.path.exists(identify_path):
            get_dbus_object("/volumes").set_identify(identify_path, bool(state))
        else:
            raise SystemError("locate LED not available (looking for '%s')" % identify_path)

    def __unicode__(self):
        if self.enclslot is None:
            return "%s %dk" % (self.type, self.rpm / 1000)
        return "%s %dk Slot %d" % (self.type, self.rpm / 1000, self.enclslot)


class GenericDisk(BlockVolume):
    """ The logical view of a standard disk (hence, BlockVolume). """
    disk_device = models.OneToOneField(DiskDevice)

    @property
    def path(self):
        return self.disk_device.path

    @property
    def host(self):
        return self.disk_device.host

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        return self.disk_device.status

    def get_status(self):
        return [self.status]

    def get_volume_usage(self, stats):
        stats["bd_megs"] = self.storageobj.megs
        return stats

    def __unicode__(self):
        return unicode(self.disk_device)




def get_storage_tree(top_obj):
    def serialize_obj(obj):
        return {
            "status":  obj.get_status(),
            "title":   unicode(obj)
            }

    def mktree(obj):
        nodes = []
        for basedev in obj.get_storage_devices():
            node = serialize_obj(basedev)
            if hasattr(basedev, "get_storage_devices") and not isinstance(basedev, VolumePool):
                node["devices"] = mktree(basedev)
            nodes.append(node)
        return nodes

    top = serialize_obj(top_obj)
    top["devices"] = mktree(top_obj)
    return top


