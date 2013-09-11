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

import operator

class AbstractCapabilityNode(object):
    op = None

    def __init__(self, lft, rgt):
        self.lft = lft
        self.rgt = rgt

    def __add__(self, other):
        return CapabilityAddNode(self, other)

    def __mul__(self, other):
        return CapabilityMulNode(self, other)

    def eval_(self, devicecaps):
        satisfied = {}

        def _get(something):
            """ Something might be True, a Capability*Node, or a Capability.
                Devicecaps is a list of capabilities that some device provides.

                Translate it to a number, in the context of devicecaps.
            """
            if something is True:
                return True
            elif isinstance(something, AbstractCapabilityNode):
                points, child_satisfied = something.eval_(devicecaps)
                satisfied.update(child_satisfied)
                return points
            elif issubclass(something, Capability):
                # check if we have a devicecap that satisfies our dependency on "something".
                # that is the case if we either have "something" directly, or a subclass
                # of it, because subclasses satisfy dependencies to their base classes.
                # btw: subclass(something, something) is True, so no need to check for
                # "something" explicitly.
                for devcap in devicecaps:
                    if issubclass(devcap, something):
                        satisfied[something] = True
                        return True
                satisfied[something] = False
                return False
            else:
                return TypeError("Unexpected type '%r'" % something)

        return self.op( _get(self.lft), _get(self.rgt) ), satisfied


class CapabilityAddNode(AbstractCapabilityNode):
    op = operator.add

class CapabilityMulNode(AbstractCapabilityNode):
    op = operator.mul


class CapabilityMeta(type):
    def __add__(self, other):
        return CapabilityAddNode(self, other)

    def __radd__(self, other):
        return CapabilityAddNode(other, self)

    def __mul__(self, other):
        return CapabilityMulNode(self, other)

    def __rmul__(self, other):
        return CapabilityMulNode(other, self)

class Capability(object):
    __metaclass__ = CapabilityMeta


class SlowSATASpeedCapability(Capability):
    """ 3.5" 7200RPM SATA disks """
    pass

class FastSATASpeedCapability(SlowSATASpeedCapability):
    """ 2.5" 10kRPM SATA disks """
    pass

class SlowSASSpeedCapability(FastSATASpeedCapability):
    """ 2.5" 10kRPM SAS Disks """
    pass

class FastSASSpeedCapability(SlowSASSpeedCapability):
    """ 2.5" 15kRPM SAS Disks """
    pass

class SSDSpeedCapability(FastSASSpeedCapability):
    """ SSDs """
    pass

class UnlimitedWritesCapability(Capability):
    """ Does not age when written to (i.e., unlike SSDs). """
    pass


class BlockbasedCapability(Capability):
    """ Block-based access e.g. over iSCSI or FC """
    pass

class FailureTolerantBlockDeviceCapability(BlockbasedCapability):
    pass

class MirroredBlockDeviceCapability(BlockbasedCapability):
    pass


class FilesystemCapability(Capability):
    """ File-based access e.g. over NFS or Samba """
    pass

class VolumeSnapshotCapability(Capability):
    """ Supports snapshots for the entire volume """
    pass

class SubvolumesCapability(FilesystemCapability):
    """ Supports shrinking """
    pass

class SubvolumeSnapshotCapability(SubvolumesCapability):
    """ Supports snapshots for subvolumes """
    pass

class FileSnapshotCapability(FilesystemCapability):
    """ Supports snapshots which can be mounted to restore individual files """
    pass

class PosixACLCapability(FilesystemCapability):
    """ Supports snapshots which can be mounted to restore individual files """
    pass

class DeduplicationCapability(FilesystemCapability):
    """ Supports deduplication """
    pass

class CompressionCapability(FilesystemCapability):
    """ Supports compression """
    pass

class GrowCapability(Capability):
    """ Supports growing """
    pass

class ShrinkCapability(Capability):
    """ Supports shrinking """
    pass

class ParallelIOCapability(FilesystemCapability):
    """ Filesystem is optimized for efficiently handling massively parallel IO. """
    pass

class SectorBlocksCapability(FilesystemCapability):
    """ File system blocksize == sector size (512 Bytes). """
    pass



class Profile(object):
    capabilities = []

class FileserverProfile(Profile):
    """ Optimized for a file server """
    capabilities = SlowSATASpeedCapability * (VolumeSnapshotCapability + PosixACLCapability) * (True + GrowCapability + ShrinkCapability + DeduplicationCapability + CompressionCapability)

class VMProfile(Profile):
    """ Optimized for running VMs that support proper disk alignment """
    capabilities = SlowSASSpeedCapability * ParallelIOCapability * (True + GrowCapability + ShrinkCapability + DeduplicationCapability + CompressionCapability)

class LegacyVMProfile(VMProfile):
    """ Optimized for running VMs that don't support disk alignment """
    capabilities = VMProfile.capabilities * SectorBlocksCapability


class Device(object):
    requires = []
    provides = []

class Disk(Device):
    requires = []
    provides = [
        BlockbasedCapability,
        ]

class Raid5(Device):
    requires = [
        BlockbasedCapability,
        ]
    provides = [
        FailureTolerantBlockDeviceCapability,
        ]

class LogicalVolume(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        VolumeSnapshotCapability,
        FailureTolerantBlockDeviceCapability,
        GrowCapability,
        ShrinkCapability,
        ]

class ExtFS(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        FilesystemCapability,
        PosixACLCapability,
        GrowCapability,
        ShrinkCapability,
        ]

class XfsDefaultBlocks(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        FilesystemCapability,
        PosixACLCapability,
        GrowCapability,
        ParallelIOCapability,
        ]

class XfsSectorBlocks(Device):
    requires = XfsDefaultBlocks.requires
    provides = XfsDefaultBlocks.provides + [SectorBlocksCapability]

class Zpool(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        FilesystemCapability,
        VolumeSnapshotCapability,
        SubvolumesCapability,
        SubvolumeSnapshotCapability,
        FileSnapshotCapability,
        GrowCapability,
        ShrinkCapability,
        DeduplicationCapability,
        CompressionCapability,
        ]

class Zfs(Device):
    requires = [
        Zpool,
        ]
    provides = [
        FilesystemCapability,
        DeduplicationCapability,
        CompressionCapability,
        VolumeSnapshotCapability,
        ]

class Btrfs(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        FilesystemCapability,
        VolumeSnapshotCapability,
        SubvolumesCapability,
        SubvolumeSnapshotCapability,
        FileSnapshotCapability,
        GrowCapability,
        ShrinkCapability,
        DeduplicationCapability,
        CompressionCapability,
        PosixACLCapability,
        ]

class BtrfsSubvolume(Device):
    requires = [
        Btrfs,
        ]
    provides = [
        FilesystemCapability,
        VolumeSnapshotCapability,
        DeduplicationCapability,
        CompressionCapability,
        PosixACLCapability,
        ]

class DrbdConnection(Device):
    requires = [
        FailureTolerantBlockDeviceCapability,
        ]
    provides = [
        FailureTolerantBlockDeviceCapability,
        MirroredBlockDeviceCapability,
        ]

class ImageFile(Device):
    requires = [
        FilesystemCapability,
        ]
    provides = [
        FailureTolerantBlockDeviceCapability,
        ]
