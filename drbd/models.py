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

import dbus

from django.conf import settings
from django.db   import models

from systemd.helpers import dbus_to_python

from lvm.models import LogicalVolume, LVChainedModule
from ifconfig.models import IPAddress, Host

DRBD_PROTOCOL_CHOICES = (
    ('A', 'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'),
    ('B', 'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'),
    ('C', 'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.'),
    )

DRBD_IO_ERROR_CHOICES = (
    ('pass_on',                 'pass_on: Report the io-error to the upper layers. On Primary report it to the '
                                'mounted file system. On Secondary ignore it.'),
    ('call-local-io-error',     'call-local-io-error: Call the handler script local-io-error.'),
    ('detach',                  'detach: The node drops its low level device, and continues in diskless mode.'),
    )

DRBD_FENCING_CHOICES = (
    ('dont-care',               'dont-care: This is the default policy. No fencing actions are undertaken.'),
    ('resource-only',           'resource-only: Try to fence the peer´s disk by calling the fence-peer handler.'),
    ('resource-and-stonith',    'resource-and-stonith: Try to fence the peer´s disk by calling the fence-peer '
                                'handler, which has to outdate or STONITH the peer.'),
    )

DRBD_AFTER_SB_0PRI_CHOICES = (
    ('disconnect',              'disconnect: No automatic resynchronization, simply disconnect.'),
    ('discard-younger-primary', 'discard-younger-primary: Auto sync from the node that was primary before the '
                                'split-brain situation happened.'),
    ('discard-older-primary',   'discard-older-primary: Auto sync from the node that became primary as second '
                                'during the split-brain situation.'),
    ('discard-zero-changes',    'discard-zero-changes: Auto sync to the node that did not touch any blocks. '
                                'If both nodes wrote something, disconnect.'),
    ('discard-least-changes',   'discard-least-changes: Auto sync from the node that touched more blocks during '
                                'the split brain situation.'),
    # TODO: No idea how to implement DISCARD-NODE-<name> here
    )

DRBD_AFTER_SB_1PRI_CHOICES = (
    ('disconnect',              'disconnect: No automatic resynchronization, simply disconnect.'),
    ('consensus',               'consensus: Discard the version of the secondary if the outcome of the '
                                'after-sb-0pri algorithm would also destroy the current secondary´s data. '
                                'Otherwise disconnect.'),
    ('violently-as0p',          'violently-as0p: This is DANGEROUS, only choose if you KNOW what you are doing.'),
    ('discard-secondary',       'discard-secondary: Discard the secondary´s version.'),
    ('call-pri-lost-after-sb',  'call-pri-lost-after-sb: Always honor the outcome of the after-sb-0pri algorithm. '
                                'In case it decides the current secondary has the right data, it calls the '
                                '"pri-lost-after-sb" handler on the current primary.'),
    )

DRBD_AFTER_SB_2PRI_CHOICES = (
    ('disconnect',              'disconnect: No automatic resynchronization, simply disconnect.'),
    ('violently-as0p',          'violently-as0p: This is DANGEROUS, only choose if you KNOW what you are doing.'),
    ('call-pri-lost-after-sb',  'call-pri-lost-after-sb: Always honor the outcome of the after-sb-0pri algorithm. '
                                'In case it decides the current secondary has the right data, it calls the '
                                '"pri-lost-after-sb" handler on the current primary.'),
    )


class Connection(models.Model):
    res_name    = models.CharField(max_length=50)
    ipaddress   = models.ForeignKey(IPAddress, blank=True, null=True)
    stack_parent = models.ForeignKey("self", blank=True, null=True, related_name="stack_child_set")
    protocol    = models.CharField(max_length=1, default="C", choices=DRBD_PROTOCOL_CHOICES)
    wfc_timeout          = models.IntegerField(blank=True, null=True, default=10,
                           help_text=("Wait for connection timeout.  The init script drbd(8) blocks the boot "
                                      "process until the DRBD resources are connected. When the cluster manager "
                                      "starts later, it does not see a resource with internal split-brain. In "
                                      "case you want to limit the wait time, do it here. Default is 0, which means "
                                      "unlimited. The unit is seconds."))
    degr_wfc_timeout     = models.IntegerField(blank=True, null=True, default=120,
                           help_text=("Wait for connection timeout, if this node was a degraded cluster. In case a "
                                      "degraded cluster (= cluster with only one node left) is rebooted, this "
                                      "timeout value is used instead of wfc-timeout, because the peer is less "
                                      "likely to show up in time, if it had been dead before. Value 0 means "
                                      "unlimited."))
    outdated_wfc_timeout = models.IntegerField(blank=True, null=True, default=15,
                           help_text=("Wait for connection timeout, if the peer was outdated. In case a degraded "
                                      "cluster (= cluster with only one node left) with an outdated peer disk is "
                                      "rebooted, this timeout value is used instead of wfc-timeout, because the "
                                      "peer is not allowed to become primary in the meantime. Value 0 means "
                                      "unlimited."))
    on_io_error = models.CharField(max_length=25, default="detach", choices=DRBD_IO_ERROR_CHOICES, help_text=(
                                   "What to do if the lower level device reports an IO error."))
    fencing     = models.CharField(max_length=25, default="dont-care", choices=DRBD_FENCING_CHOICES, help_text=(
                                   "Preventive measures to avoid situations where both nodes are primary and "
                                   "disconnected (AKA split brain)."))
    cram_hmac_alg = models.CharField(max_length=25, default="sha1", help_text=(
                                   "Digest algorithm used for peer authentication."))
    secret      = models.CharField(max_length=250, blank=True, help_text=(
                                   "Shared secret used for peer authentication."))
    sb_0pri     = models.CharField(max_length=25, default="discard-younger-primary",
                                   choices=DRBD_AFTER_SB_0PRI_CHOICES, help_text=(
                                   "What to do if we reconnect a Split Brain with 0 Primaries."))
    sb_1pri     = models.CharField(max_length=25, default="discard-secondary",
                                   choices=DRBD_AFTER_SB_1PRI_CHOICES, help_text=(
                                   "What to do if we reconnect a Split Brain with 1 Primary."))
    sb_2pri     = models.CharField(max_length=25, default="disconnect",
                                   choices=DRBD_AFTER_SB_2PRI_CHOICES, help_text=(
                                   "What to do if we reconnect a Split Brain with 2 Primaries."))
    syncer_rate = models.CharField(max_length=25, blank=True, default="5M", help_text=(
                                   "Bandwidth limit for background synchronization, measured in "
                                   "K/M/G<b><i>Bytes</i></b>."))

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._drbd = None

    @property
    def stacked(self):
        if self.stack_child_set.count() > 0:
            return max([ lowerconn.endpoints_running_here for lowerconn in self.stack_child_set.all() ])
        return False

    @property
    def local_lower_connection(self):
        """ Find the lower connection that is running on this host (if any). """
        if not self.stacked:
            return None
        for lowerconn in self.stack_child_set.all():
            if lowerconn.endpoints_running_here:
                return lowerconn

    @property
    def endpoints_running_here(self):
        """ Check if any of my endpoints run here. """
        return self.endpoint_set.filter(volume__vg__host=Host.objects.get_current()).count() > 0

    @property
    def local_endpoint(self):
        """ Return the endpoint that runs here. """
        if not self.endpoints_running_here and self.stacked:
            return self.local_lower_connection.local_endpoint
        return self.endpoint_set.get(volume__vg__host=Host.objects.get_current())

    @property
    def drbd(self):
        if self._drbd is None:
            self._drbd = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/drbd")
        return self._drbd

    @property
    def cstate(self):
        return dbus_to_python(self.drbd.get_cstate(self.res_name, self.stacked))

    @property
    def dstate(self):
        return dbus_to_python(self.drbd.get_dstate(self.res_name, self.stacked))

    @property
    def role(self):
        return dbus_to_python(self.drbd.get_role(self.res_name, self.stacked))

    def primary(self):
        return self.drbd.primary(self.res)

    @property
    def is_primary(self):
        return self.role["self"] == "Primary"


class Endpoint(LVChainedModule):
    connection = models.ForeignKey(Connection)
    ipaddress  = models.ForeignKey(IPAddress)

    @property
    def running_here(self):
        return (self.volume.vg.host == Host.objects.get_current())

    @property
    def res(self):
        return self.connection.res_name

    @property
    def path(self):
        return "/dev/drbd%d" % self.id

    @property
    def standby(self):
        if not self.connection.is_primary:
            return True
        if self.connection.stack_parent is None:
            return False
        return not self.connection.stack_parent.is_primary

    def setupfs(self):
        if self.connection.role['self'] == "Primary":
            self.volume.setupfs()
            return False
        else:
            self.volume.formatted = True
            return True

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.volume.filesystem:
            raise ValidationError('This share type can not be used on volumes with a file system.')

    def install(self):
        self.connection.drbd.conf_write(self.id)
        self.connection.drbd.createmd(self.res)
        self.connection.drbd.up(self.res)

        if self.init_master:
            self.connection.drbd.primary_overwrite(self.res)

    def uninstall(self):
        self.connection.drbd.down(self.res)
        self.connection.drbd.conf_delete(self.id)
