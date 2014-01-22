# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# This file contains excerpts from `man drbd.conf`.
# Copyright 2001-2008 LINBIT Information Technologies, Philipp Reisner, Lars Ellenberg.

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

from collections                import Counter

from django.db                  import models
from django.contrib.auth.models import User

from systemd                    import dbus_to_python, get_dbus_object

from volumes                    import signals as volume_signals
from volumes.models             import BlockVolume, VolumePool
from lvm                        import blockdevices
from ifconfig.models            import Host, IPAddress, NetDevice, getHostDependentManagerClass
from peering.models             import PeerHost

DRBD_PROTOCOL_CHOICES = (
    ('A', 'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'),
    ('B', 'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'),
    ('C', 'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.'),
    )

class ConnectionManager(models.Manager):
    def _get_host_primary_ipaddress(self, host):
        return IPAddress.all_objects.get(device__host=host, primary_address=True)

    def create_connection(self, other_host_id, peer_volumepool_id, protocol, syncer_rate, self_volume_id):
        self_volume = BlockVolume.objects.get(id=self_volume_id)
        other_host = Host.objects.get(id=other_host_id);

        # create drbd connection object
        connection = Connection(name=self_volume.volume.name, protocol=protocol, syncer_rate=syncer_rate)
        connection.save()

        # self endpoint install
        self.install_connection(connection, Host.objects.get_current(), other_host, True, self_volume, peer_volumepool_id)

        volume_signals.post_install.send(sender=BlockVolume, instance=self)

        return connection.id

    def install_connection(self, connection, self_host, other_host, is_primary, primary_volume, peer_volumepool_id):
        get_dbus_object("/").start_queue()
        if is_primary:
            # set upper volume
            primary_volume.upper = connection
            primary_volume.save()

            volume = primary_volume
        else:
            # create volume on peer host
            vpool = VolumePool.objects.get(id=peer_volumepool_id)
            peer_volume = vpool.volumepool._create_volume(primary_volume.volume.name, primary_volume.volume.megs, \
                primary_volume.volume.owner, "", primary_volume.volume.fswarning, primary_volume.volume.fscritical)

            # set upper volume
            peer_volume.upper = connection
            peer_volume.save()

            volume = peer_volume

        # get primary ip-address
        ipaddress = self._get_host_primary_ipaddress(self_host)

        # create drbd endpoint
        endpoint = Endpoint(connection=connection, ipaddress=ipaddress, volume=volume)
        endpoint.save()

        if is_primary:
            # peer endpoint install
            peer_host = PeerHost.objects.get(host_id=other_host.id)
            peer_host.drbd.Connection.install_connection(connection.id, other_host.id, self_host.id, False, primary_volume.id, peer_volumepool_id)


        endpoint.install(is_primary)
        get_dbus_object("/").run_queue_background()
        return endpoint.id

class Connection(BlockVolume):
    name        = models.CharField(max_length=50)
    protocol    = models.CharField(max_length=1, default="C", choices=DRBD_PROTOCOL_CHOICES)
    syncer_rate = models.CharField(max_length=25, blank=True, default="5M", help_text=(
                                    "Bandwidth limit for background synchronization, measured in "
                                    "K/M/G<b><i>Bytes</i></b>."))

    objects = ConnectionManager()

    def __init__(self, *args, **kwargs):
        models.Model.__init__(self, *args, **kwargs)
        self._drbd = None

    def __unicode__(self):
        return self.name

    @property
    def drbd(self):
        if self._drbd is None:
            self._drbd = get_dbus_object("/drbd")
        return self._drbd

    @property
    def megs(self):
        return blockdevices.get_disk_size("drbd%d" % self.id)

    @property
    def port(self):
        return 7700 + self.id

    @property
    def host(self):
        info = dbus_to_python(self.drbd.get_role(self.name, False))
        info_count = Counter(info.values())

        if info_count["Primary"] == 2 or \
            (info_count["Primary"] == 1 and \
                [host for host, status in info.items() if status == "Primary"][0] == "self"):
            return Host.objects.get_current()
        elif info_count["Primary"] == 0:
            return None
        else:
            return self.peerhost

    @property
    def path(self):
        return "/dev/drbd%d" % self.id

    @property
    def status(self):
        return dbus_to_python(self.drbd.get_cstate(self.name, False))

    @property
    def type(self):
        return "DRBD Connection"

    @property
    def peerhost(self):
        for endpoint in Endpoint.objects.filter(connection=self):
            if endpoint.ipaddress.device.host != Host.objects.get_current():
                host_peer = endpoint.ipaddress.device.host
                break

        if host_peer:
            return host_peer
        else:
            None

    @property
    def endpoints_running_here(self):
        """ Check if any of my endpoints run here. """
        if self.endpoint_set.filter(ipaddress__device__host=Host.objects.get_current()).count() > 0:
            return True
        else:
            return False

    def post_install(self):
        pass


class Endpoint(models.Model):
    connection  = models.ForeignKey(Connection, related_name="endpoint_set")
    ipaddress   = models.ForeignKey(IPAddress)
    volume      = models.ForeignKey(BlockVolume, null=True, related_name="accessor_endpoint_set")

    objects     = getHostDependentManagerClass("ipaddress__device__host")()
    all_objects = models.Manager()

    def __unicode__(self):
        return self.ipaddress.device.host.name

    @property
    def running_here(self):
        return (self.connection.host == Host.objects.get_current())

    @property
    def type(self):
        return "DRBD Endpoint"

    @property
    def megs(self):
        return blockdevices.get_disk_size("drbd%d" % self.connection.id)

    @property
    def path(self):
        return self.volume.volume.path

    @property
    def status(self):
        info = dbus_to_python(self.connection.drbd.get_dstate(self.connection.name, False))
        return info["self"]

    @property
    def host(self):
        return self.ipaddress.device.host

    @property
    def is_primary(self):
        info = dbus_to_python(self.connection.drbd.get_role(self.connection.name, False))
        return info["self"] == "Primary"

    def install(self, init_primary):
        self.connection.drbd.conf_write()
        self.connection.drbd.createmd(self.connection.name, False)
        self.connection.drbd.up(self.connection.name, False)

        if init_primary:
            self.connection.drbd.primary_overwrite(self.connection.name, False)
