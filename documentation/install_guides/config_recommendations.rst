.. _hardware recommendations:

Hardware Recommendations
------------------------

#.  Buy an enclosure with enough room for disks. The absolute minimum
    recommendation is twelve disks, but if you can, you should add two
    hot-spares, so make that fourteen. For larger setups, use 24 disks.

    .. warning::
      Any other number of disks will hinder performance.

#.  Are you building a storage backend for virtualization? If so, you will
    require SAS disks, a very clean setup and a good caching mechanism to
    achieve good performance.

    .. note::
      Using SSDs instead of SAS disks does not necessarily boost performance. A
      clean setup on SAS disks delivers the same performance as SSDs, and an
      unclean SSD setup may even be slower.

#.  If the enclosure has any room for hot spare disks, you should have some
    available. This way a disk failure can be dealt with immediately, instead
    of having to wait until the disk has been replaced.

    .. note::
      A degraded RAID only delivers limited performance. Taking measures to
      minimize the time until it can resume normal operations is therefore
      highly advisable.

#.  You should have some kind of hardware device for caching. If you're using a
    RAID controller, make sure it has a BBU installed so you can make use of
    the integrated cache. For ZFS setups, consider adding two SSDs.

    .. note::

      When using SSDs for caching, the total size of the cache should be one
      tenth the size of the device being cached, and the cache needs to be ten
      times faster. So:

      * only add a cache if you have to - no guessing allowed, measure!
      * don't make it too large
      * don't add an SSD cache to a volume that is itself on SSDs

#.  Do you plan on using replication in order to provide failure tolerance? If
    so, ...

    * you will require the same hardware for all of your nodes, because when
      using synchronous   replication, the slowest node limits the
      performance of the whole system.
    * make sure the network between the nodes has a low latency and enough
      bandwidth to support not only the bandwidth your application needs, but
      also has some extra for bursts and recovery traffic.

    .. note::
      When running VMs, a Gigabit link will get you pretty far. Money for a
      10GE card would be better spent on faster disks.

#.  You should have a dedicated line available for replication and cluster
    communication. There should be no other active components on that line, so
    that when the line goes down, the cluster can safely assume its peer to be
    dead.

#.  Up to the supported maximum of 128GB per node, add as much RAM as you
    can (afford). The operating system will require about 1GB for itself,
    everything else is then used for things like caching and the ZFS
    deduplication table. Adding more RAM will generally speed things up and is
    always a good idea.

.. _storage recommendations:

Storage Recommendations
-----------------------

#.  Consider dedicating two disks to a RAID1 for the operating system. It
    doesn't matter if you use hardware or software RAID for this volume, just
    that you split it off from the rest.

    .. note::
      You can also use other devices to boot from if they fit your redundancy needs.

#.  When using hardware RAID:

    #.  Group the other disks into RAID5 arrays of exactly 5 disks each with a
        chunk size (strip size) of 256KiB.  Do not create a partition table on
        these devices. If your RAID controller does not support 256KiB chunks,
        use the largest supported chunk size.
    #.  Using mdadm, create a Software-RAID0 device on exactly two or four of
        your hardware RAID devices.  Again, do not create a partition table on
        the resulting MD device. Make sure the chunk size of the RAID0 array
        matches that of the underlying RAID5 arrays.  This way, you will not
        be able to add more than 20 disks to one PV. This is intentional. If
        you need to add more disks, create multiple PVs in the same manner.
    #.  Using pvcreate, create an LVM Physical Volume on the MD device and add
        it to a VG using vgcreate or vgextend.
    #.  Do not mix PVs of different speeds in one single VG.

#.  When using ZFS:

    You will need to specify the complete layout in the zpool create command,
    so before running it, consider all the following points.

    #.  Group exactly six disks in each raidz2. Use multiple raidz2 vdevs in
        order to add all disks to the zpool.
    #.  When adding SSDs, add them as mirrored log devices.
    #.  Set the mount point to /media/<poolname> instead of just /<poolname>.
    #.  Do not use /dev/sdc etc, but use /dev/disk/by-id/... paths instead.

    So, the command you're going to use will look something like this::

        # zpool create -m /media/tank tank \
          raidz2 /dev/disk/by-id/scsi-3500000e1{1,2,3,4,5,6} \
          raidz2 /dev/disk/by-id/scsi-350000392{1,2,3,4,5,6} \
          log mirror /dev/disk/by-id/scsi-SATA_INTEL_SSD{1,2}

.. _further operating system configuration hints:

Further Operating System Configuration Hints
--------------------------------------------

#. Disable swap.

#. In a two-node cluster, add a variable named ``$PEER`` to your environment
   that contains the hostname (not the FQDN) of the cluster peer node.  This
   simplifies every command that has something to do with the peer. Exchange
   SSH keys.

#. In pacemaker-based clusters, define the following Shell aliases to make
   your life easier::

     alias maint="crm configure property maintenance-mode=true"
     alias unmaint="crm configure property maintenance-mode=false"

#. After setting up MD raids, make sure ``mdadm.conf`` is up to date. This can
   be ensured by running these commands::

     # /usr/share/mdadm/mkconf > /etc/mdadm/mdadm.conf
     # update-initramfs -k all -u

#. You may want to install the ``ladvd`` package, which will ensure that your
   switches correctly identify your system using LLDP.

#. Make sure ``/etc/drbd.d/global_common.conf`` contains the following
   variables::

       disk {
        no-disk-barrier;
        no-disk-flushes;
        no-md-flushes;
       }

       net {
        max-buffers 8000;
        max-epoch-size 8000;
       }

       syncer {
        al-extents 3389;
       }
