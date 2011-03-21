# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# This file contains excerpts from `man drbd.conf`.
# Copyright 2001-2008 LINBIT Information Technologies, Philipp Reisner, Lars Ellenberg.

from django.db import models

from lvm.models import LogicalVolume, LVChainedModule
from peering.models import PeerHost

from drbd.procutils import drbd_cstate, drbd_dstate, drbd_role

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



class DrbdDevice(LVChainedModule):
    peerhost    = models.ForeignKey(PeerHost, help_text='The host on which to mirror this device.')
    selfaddress = models.CharField(max_length=250, help_text="The <b>local</b> address to bind this device to.")
    peeraddress = models.CharField(max_length=250, help_text="The <b>remote</b> address to connect this device to.")
    resname     = models.CharField(max_length=25, blank=True, help_text=(
                                   "Resource name to use in the config. Will default to 'r<i>&lt;id&gt;</i>' "
                                   "if not given."))
    init_master = models.BooleanField(blank=True, help_text=(
                                      "True if the <b>local</b> side is to be initialized as master."))
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

    @property
    def res(self):
        if self.resname:
            return self.resname
        return "r%d" % self.id

    @property
    def path(self):
        return "/dev/drbd%d" % self.id

    @property
    def cstate(self):
        if self.state not in ("pending", "active"):
            return None
        return drbd_cstate(self.res)

    @property
    def dstate(self):
        if self.state not in ("pending", "active"):
            return None
        return dict(zip(("self", "peer"), drbd_dstate(self.res).split('/')))

    @property
    def role(self):
        if self.state not in ("pending", "active"):
            return None
        return dict(zip(("self", "peer"), drbd_role(self.res).split('/')))

    @property
    def peerdevice(self):
        """ The counterpart device on our peer, if any. """
        alldevs = self.peerhost.getjson("/api/drbd/devs/")
        for dev in alldevs:
            if dev['peeraddress'] == self.selfaddress and dev['selfaddress'] == self.peeraddress:
                return dev
        return None

    @property
    def format_policy(self):
        if not self.init_master:
            return "skip"
        if self.state != "active":
            return "not-yet"
        return "ok"

    def install(self):
        from drbd.installer import install_resource
        return install_resource(self)
