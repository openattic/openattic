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

from collections 				import Counter

from django.db   				import models
from django.contrib.auth.models import User

from systemd					import dbus_to_python, get_dbus_object

from volumes.models 			import BlockVolume, VolumePool
from lvm 						import blockdevices
from ifconfig.models			import Host, IPAddress, NetDevice
from peering.models				import PeerHost

DRBD_PROTOCOL_CHOICES = (
    ('A', 'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'),
    ('B', 'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'),
    ('C', 'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.'),
    )

class ConnectionManager(models.Manager):
	def _get_host_primary_ipaddress(self, host):
		return IPAddress.all_objects.get(device__host=host, primary_address=True)

	def create_connection(self, peer_host_id, peer_volumepool_id, self_volume_id, volume_name, volume_megs, owner_id, fswarning, fscritical):
		# create volume on peer host
		peer_host = PeerHost.objects.get(host_id=peer_host_id)
		peer_volume = peer_host.volumes.VolumePool.create_volume(peer_volumepool_id, volume_name, volume_megs, {"app": "auth", "obj": "User", "id": owner_id}, "", fswarning, fscritical)

		# create drbd connection object
		connection = Connection(name=volume_name, protocol="C", syncer_rate="200M")
		connection.save()

		# create drbd endpoints
		self_ipaddress = self._get_host_primary_ipaddress(Host.objects.get_current())	
		self_endpoint = Endpoint(connection=connection, ipaddress=self_ipaddress, volume=BlockVolume.objects.get(id=self_volume_id))
		self_endpoint.save()

		peer_ipaddress = self._get_host_primary_ipaddress(Host.objects.get(id=peer_host_id))
		peer_endpoint = Endpoint(connection=connection, ipaddress=peer_ipaddress, volume=BlockVolume.objects.get(id=peer_volume["id"]))
		peer_endpoint.save()

		return connection.id

class Connection(BlockVolume):
	name 		= models.CharField(max_length=50)
	protocol 	= models.CharField(max_length=1, default="C", choices=DRBD_PROTOCOL_CHOICES)
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

class Endpoint(models.Model):
	connection 	= models.ForeignKey(Connection, related_name="endpoint_set")
	ipaddress 	= models.ForeignKey(IPAddress)
	volume 		= models.ForeignKey(BlockVolume, null=True, related_name="accessor_endpoint_set")

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

	def install(self):
		self.connection.drbd.conf_write()
		self.connection.drbd.up(self.connection.name, False)
