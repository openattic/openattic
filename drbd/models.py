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

from django.db   		import models

from systemd			import dbus_to_python, get_dbus_object

from volumes.models 	import BlockVolume
from lvm 				import blockdevices
from ifconfig.models	import Host, IPAddress

DRBD_PROTOCOL_CHOICES = (
    ('A', 'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'),
    ('B', 'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'),
    ('C', 'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.'),
    )

class Connection(BlockVolume):
	name 		= models.CharField(max_length=50)
	protocol 	= models.CharField(max_length=1, default="A", choices=DRBD_PROTOCOL_CHOICES)
	syncer_rate = models.CharField(max_length=25, blank=True, default="5M", help_text=(
									"Bandwidth limit for background synchronization, measured in "
									"K/M/G<b><i>Bytes</i></b>."))

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
	def host(self):
		return Host.objects.get(name="srvliotest01.master.dns")

	@property
	def path(self):
		return "/dev/drbd%d" % self.id

	@property
	def status(self):
		info = dbus_to_python(self.drbd.get_dstate(self.name, False))

		status = "%s(%s)" % (Host.objects.get_current().name, info["self"])

		if self.peerhost:
			status += "<br />%s(%s)" % (self.peerhost.name, info["peer"])

		return status

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
	connection 	= models.ForeignKey(Connection)
	ipaddress 	= models.ForeignKey(IPAddress)

	def __unicode__(self):
		return "%s: %s" % (self.connection.name, self.ipaddress.device.host.name)