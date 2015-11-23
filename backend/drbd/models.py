# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# This file contains excerpts from `man drbd.conf`.
# Copyright 2001-2008 LINBIT Information Technologies, Philipp Reisner, Lars Ellenberg.

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

import re
import socket
import dbus

from collections                import Counter

from django.db                  import models, transaction
from django.template.loader     import render_to_string
from django.utils.translation   import ugettext_noop as _

from systemd                    import dbus_to_python, get_dbus_object
from systemd.helpers            import Transaction

from volumes.models             import StorageObject, BlockVolume, VolumePool
from ifconfig.models            import Host, IPAddress, getHostDependentManagerClass

DRBD_PROTOCOL_CHOICES = (
    ('A', 'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'),
    ('B', 'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'),
    ('C', 'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.'),
    )

class ConnectionManager(models.Manager):
    hostfilter = "host"

    def _get_host_primary_ipaddress(self, host):
        return IPAddress.all_objects.get(device__host=host, primary_address=True)

    def create_connection(self, protocol, syncer_rate, source_volume_id):
        source_volume = StorageObject.objects.get(id=source_volume_id).blockvolume_or_none

        # create drbd connection object
        with Transaction():
            with StorageObject(name=source_volume.storageobj.name, megs=source_volume.storageobj.megs, is_origin=True) as self_storageobj:
                connection = Connection(storageobj=self_storageobj, protocol=protocol, syncer_rate=syncer_rate)
                connection.full_clean()
                connection.save()

                # Allocate minor
                try:
                    with transaction.atomic():
                        # First we select all free minors, in the process locking them for the duration of this
                        # transaction, so no other process can steal the minor we're going to use.
                        free_minor = min([dm["minor"] for dm in
                                          DeviceMinor.objects.select_for_update().filter(connection__isnull=True).values("minor")])
                        # now update the minor with our ID.
                        DeviceMinor.objects.filter(minor=free_minor).update(connection=connection)
                except ValueError:
                    raise SystemError("Cannot allocate device minor")

                # Re-query the Connection so the deviceminor is known
                connection = Connection.all_objects.get(id=connection.id)

                host = Host.objects.get_current()
                endpoint = Endpoint(connection=connection, ipaddress=host.get_primary_ip_address(), volume=source_volume)
                endpoint.save()

                return connection

    def install_connection(self, connection_id, source_volume_id, peer_volumepool_id=None):
        connection = Connection.all_objects.get(id=connection_id)
        source_volume = StorageObject.objects.get(id=source_volume_id).blockvolume_or_none
        if peer_volumepool_id is None:
            peer_volumepool = None
        else:
            peer_volumepool = StorageObject.objects.get(id=peer_volumepool_id).volumepool_or_none
        with Transaction():
            self._install_connection(connection, source_volume, peer_volumepool)
        return connection

    def _install_connection(self, connection, source_volume, peer_volumepool):
        if not peer_volumepool:
            # Primary host
            volume = source_volume
            endpoint = Endpoint.objects.get(volume=volume)

            is_primary = True
        else:
            # Secondary host
            volume = peer_volumepool.volumepool._create_volume(source_volume.storageobj.name,
                                                               source_volume.storageobj.megs, {})

            host = Host.objects.get_current()
            # create drbd endpoint
            endpoint = Endpoint(connection=connection, ipaddress=host.get_primary_ip_address(), volume=volume)
            endpoint.save()

            is_primary = False

        # set upper volume
        volume_so = volume.storageobj
        volume_so.upper = connection.storageobj
        volume_so.save()

        endpoint.install(is_primary)

class Connection(BlockVolume):
    protocol    = models.CharField(max_length=1, default="C", choices=DRBD_PROTOCOL_CHOICES)
    syncer_rate = models.CharField(max_length=25, blank=True, default="5M", help_text=(
                                    "Bandwidth limit for background synchronization, measured in "
                                    "K/M/G<b><i>Bytes</i></b>."))

    objects = ConnectionManager()
    all_objects = models.Manager()

    def __init__(self, *args, **kwargs):
        models.Model.__init__(self, *args, **kwargs)
        self._drbd = None

    def full_clean(self, exclude=None, validate_unique=True):
        models.Model.full_clean(self, exclude=exclude, validate_unique=validate_unique)
        from django.core.exceptions import ValidationError
        try:
            rate = self.get_syncer_rate()
        except ValueError, err:
            raise ValidationError({"syncer_rate": [unicode(err)]})
        if not (500 * 1024 <= rate <= 100 * 1024**2):
            raise ValidationError({"syncer_rate": [_("syncer rate must be between 500K and 100M")]})

    def get_syncer_rate(self):
        m = re.match(r'^(?P<num>\d+)(?P<unit>[KMG]?)$', self.syncer_rate)
        if m is None:
            raise ValueError(_("syncer rate must be in <number>[K|M|G] format"))
        mult = {
            '':  1024,
            'K': 1024,
            'M': 1024**2,
            'G': 1024**3,
            }
        return int(m.group("num")) * mult[m.group("unit")]

    @property
    def name(self):
        return self.storageobj.name

    def __unicode__(self):
        return self.name

    @property
    def drbd(self):
        if self._drbd is None:
            self._drbd = get_dbus_object("/drbd")
        return self._drbd

    @property
    def port(self):
        return 7700 + self.deviceminor.minor

    @property
    def host(self):
        if self.storageobj.is_locked:
            return Host.objects.get_current()

        try:
            info = dbus_to_python(self.drbd.get_role(self.name, False))
        except dbus.DBusException:
            raise SystemError("Can not determine the primary host. Is the DRBD connection possibly unconfigured?")

        info_count = Counter(info.values())

        if info_count["Primary"] == 2 or \
            (info_count["Primary"] == 1 and
                [host for host, status in info.items() if status == "Primary"][0] == "self"):
            return Host.objects.get_current()
        elif info_count["Primary"] == 0:
            return None
        else:
            return self.peerhost

    @property
    def path(self):
        return "/dev/drbd%d" % self.deviceminor.minor

    @property
    def status(self):
        if self.storageobj.is_locked:
            return "locked"
        try:
            return dbus_to_python(self.drbd.get_cstate(self.name, False))
        except dbus.DBusException:
            return None

    def get_status(self):
        return [{
            "StandAlone":   "degraded",
            "WFConnection": "degraded",
            "Connected":    "online",
            "WFBitMapS":    "rebuilding",
            "WFBitMapT":    "rebuilding",
            "SyncSource":   "rebuilding",
            "SyncTarget":   "rebuilding",
        }[self.status]]

    def get_volume_usage(self, stats):
        stats["bd_megs"] = self.storageobj.megs
        return stats

    @property
    def peerhost(self):
        for endpoint in Endpoint.all_objects.filter(connection=self):
            if endpoint.host != Host.objects.get_current():
                return endpoint.host
        return None

    @property
    def endpoints_running_here(self):
        """ Check if any of my endpoints run here. """
        return self.endpoint_set.filter(ipaddress__device__host=Host.objects.get_current()).count() > 0

    def post_install(self):
        pass

    def get_storage_devices(self):
        return Endpoint.all_objects.filter(connection=self)

    def uninstall_local_storage_device(self):
        local_endpoint = Endpoint.objects.get(connection=self)
        local_endpoint.uninstall()

    def grow(self, old_size, new_size):
        self.drbd.resize(self.name, False)

    def resize_local_storage_device(self, new_size):
        if self.status != "Connected":
            raise SystemError("Can only resize DRBD volumes in 'Connected' state, current state is '%s'" % self.status)
        if self.storageobj.megs >= new_size:
            raise SystemError("The size of a DRBD connection can only be increased but the new size is smaller than"
                              " the current size.")

        local_endpoint = Endpoint.objects.get(connection=self)
        local_endpoint.volume.storageobj.resize(new_size)


class Endpoint(models.Model):
    connection  = models.ForeignKey(Connection, related_name="endpoint_set")
    ipaddress   = models.ForeignKey(IPAddress)
    volume      = models.ForeignKey(BlockVolume, related_name="accessor_endpoint_set")

    objects     = getHostDependentManagerClass("volume__volume__host")()
    all_objects = models.Manager()

    def __unicode__(self):
        return "Endpoint running on %s" % self.ipaddress.device.host.name

    @property
    def running_here(self):
        return (self.connection.host == Host.objects.get_current())

    @property
    def type(self):
        return "DRBD Endpoint"

    @property
    def megs(self):
        return self.volume.storageobj.megs

    @property
    def path(self):
        return self.volume.volume.path

    @property
    def status(self):
        if self.connection.storageobj.is_locked:
            return "locked"
        try:
            info = dbus_to_python(self.connection.drbd.get_dstate(self.connection.name, False))
            return info["self"]
        except dbus.DBusException:
            return None

    def get_status(self):
        return [{
            None:           "unknown",
            "locked":       "locked",
            "Diskless":     "offline",
            "Inconsistent": "degraded",
            "Outdated":     "degraded",
            "Consistent":   "offline",
            "UpToDate":     "online",
        }[self.status], {
            None:   "unknown",
            False:  "secondary",
            True:   "primary"
        }[self.is_primary]]

    def get_storage_devices(self):
        return [self.volume.volume]

    @property
    def host(self):
        return self.volume.volume.host

    @property
    def is_primary(self):
        if self.connection.storageobj.is_locked:
            return None
        try:
            info = dbus_to_python(self.connection.drbd.get_role(self.connection.name, False))
            return info["self"] == "Primary"
        except dbus.DBusException:
            return None

    def install(self, init_primary):
        conf = ""
        #for lowerconn in self.connection.stack_child_set.all():
        #    conf += render_to_string( "drbd/device.res", {
        #        'Hostname':   socket.gethostname(),
        #        'Connection': lowerconn,
        #        'UpperConn':  self.connection
        #        } )

        conf += render_to_string( "drbd/device.res", {
            'Hostname':   socket.gethostname(),
            'Connection': self.connection,
            'Endpoints':  Endpoint.all_objects.filter(connection=self.connection),
            'UpperConn':  None
            } )

        self.connection.storageobj.lock()
        self.connection.drbd.modprobe()
        self.connection.drbd.conf_write(self.connection.name, conf)
        self.connection.drbd.createmd(self.connection.name, False)
        self.connection.drbd.wait_for_device(self.volume.volume.path)
        self.connection.drbd.up(self.connection.name, False)

        if init_primary:
            self.connection.drbd.primary_overwrite(self.connection.name, False)

    def _uninstall(self):
        self.connection.storageobj.lock()

        # if contains a filesystem. on primary only.
        fs_volume = self.connection.storageobj.filesystemvolume_or_none
        if fs_volume:
            fs_volume.volume.unmount()

        self.connection.drbd.down(self.connection.name, False)
        self.connection.drbd.conf_delete(self.connection.name)
        self.volume.storageobj.delete()

    def uninstall(self):
        # wrapper around _uninstall() that runs uninstall in a Transaction.
        # locally, this is done when _uninstall() is called as a part of StorageObject.delete(),
        # but when that function calls out to its peer, the peer doesn't use SO.delete() and
        # hence would not be inside a transaction without this wrapper.
        with Transaction(background=False):
            self._uninstall()


class DeviceMinor(models.Model):
    minor       = models.IntegerField(unique=True)
    connection  = models.OneToOneField(Connection, null=True, on_delete=models.SET_NULL)
