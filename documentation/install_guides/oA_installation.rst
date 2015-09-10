System requirements
===================

Operating System Requirements
-----------------------------

.. note::
  |oA| has been designed to be installed on a 64-bit Linux operating system.
  Installation on 32-bit systems is not supported.

The following Linux distributions are currently supported:

* Debian Linux 7 (Wheezy)
* Debian Linux 8 (Jessie)
* Ubuntu Linux 12.04 LTS (Precise)
* Ubuntu Linux 14.04 LTS (Trusty)
* Red Hat Enterprise Linux 7 (RHEL) and derivatives (CentOS 7, Oracle Linux 7
  or Scientific Linux 7)

In order to use the ZFS file system, you need to install ZFS on Linux
separately. Installation packages for the distributions supported are
available from the ZFS on Linux web site <http://zfsonlinux.org/>.

FibreChannel support requires at least Linux kernel version 3.5.

Hardware Considerations
-----------------------

|oA| is designed to run on commodity hardware, so you are not in any way bound
to a specific vendor or hardware model.

You need to make sure that your Linux distribution of choice supports the
hardware you intend to use. Check the respective hardware compatibility lists
or consult your vendor for details.

However, there are a couple of things you should be aware of when designing the
system.

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

Preparing the Installation
--------------------------

#.  Always dedicate two disks to a RAID1 for the system. It doesn't matter if
    you use hardware or software RAID for this volume, just that you split it
    off from the rest.

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

    You will need to specify the complete layout in the zpool create command, so before running it, consider all the following points.

    #.  Group exactly six disks in each raidz2. Use multiple raidz2 vdevs in order to add all disks to the zpool.
    #.  When adding SSDs, add them as mirrored log devices.
    #.  Set the mount point to /media/<poolname> instead of just /<poolname>.
    #.  Do not use /dev/sdc etc, but use /dev/disk/by-id/... paths instead.

    So, the command you're going to use will look something like this::

        # zpool create -m /media/tank tank \
          raidz2 /dev/disk/by-id/scsi-3500000e1{1,2,3,4,5,6} \
          raidz2 /dev/disk/by-id/scsi-350000392{1,2,3,4,5,6} \
          log mirror /dev/disk/by-id/scsi-SATA_INTEL_SSD{1,2}

Operating System Configuration Hints
------------------------------------

#. Disable swap.

#. Make sure the output of ``hostname --fqdn`` is something that makes sense, e.g.
   ``srvopenattic01.example.com`` instead of ``localhost.localdomain``.  If
   this doesn't fit, edit ``/etc/hostname`` and ``/etc/hosts`` to contain the
   correct names.

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

#. Install and configure an NTP daemon.

#. You may want to install the ``ladvd`` package, which will ensure that your
   switches correctly identify your system using LLDP.

#. Make sure ``/etc/drbd.d/global_common.conf`` contains the following variables::

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

Installation on Debian/Ubuntu Linux
===================================

Enabling the |oA| Apt package repository
----------------------------------------

In order to use enable the |oA| Apt repository, create a file named
``/etc/apt/sources.list.d/openattic.list``, and put the following lines into
it:

For Debian 7 (Wheezy)
~~~~~~~~~~~~~~~~~~~~~

::

  deb     http://apt.openattic.org/ wheezy   main
  deb-src http://apt.openattic.org/ wheezy   main

For Debian 8 (Jessie)
~~~~~~~~~~~~~~~~~~~~~

.. note::
  Currently, only the nightly packages are supported for Debian Jessie.

::

  deb     http://apt.openattic.org/ jessie   main
  deb-src http://apt.openattic.org/ jessie   main
  deb     http://apt.openattic.org/ nightly  main
  deb-src http://apt.openattic.org/ nightly  main

For Ubuntu 14.04 LTS
~~~~~~~~~~~~~~~~~~~~

::

  deb     http://apt.openattic.org/ trusty   main
  deb-src http://apt.openattic.org/ trusty   main

Enabling Nightly Builds (for Debian Jessie or Ubuntu Trusty)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to the offical releases, we also provide nightly builds, build off
the current development branch.

Add the following to the existing ``/etc/apt/sources.list.d/openattic.list```
file::

  deb     http://apt.openattic.org/ nightly  main
  deb-src http://apt.openattic.org/ nightly  main

Importing the |oA| Keyfile
~~~~~~~~~~~~~~~~~~~~~~~~~~

The |oA| packages are signed using a cryptographic key. You can import the
key's public key from the download site using the following command:

::

  # wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -

Installation (Debian Jessie)
----------------------------

::

  # apt-key adv --recv --keyserver hkp://keyserver.ubuntu.com A7D3EAFA
  # echo deb http://apt.open-attic.org/ jessie main > /etc/apt/sources.list.d/openattic.list
  # apt-get update
  # apt-get install openattic
  # oaconfig install

Installation (Ubuntu Trusty 14.04)
----------------------------------

::

  # apt-key adv --recv --keyserver hkp://keyserver.ubuntu.com A7D3EAFA
  # echo deb http://apt.open-attic.org/ trusty main > /etc/apt/sources.list.d/openattic.list
  # apt-get update
  # apt-get install openattic
  # oaconfig install


Installation on Red Hat Enterprise Linux (and Derivatives)
==========================================================

Starting with version 2.0, |oA| will also be available for RPM-based Linux
distributions, namely Red Hat Enterprise Linux 7 (RHEL) and derivatives (e.g.
CentOS 7, Oracle Linux 7 or Scientific Linux 7). The software will be
delivered in the form of RPM packages via dedicated yum repositories.

.. note::
   Currently, only nightly builds of the RPMs are available for preview purposes.

Preliminary Preparations on RHEL 7
----------------------------------

To install on RHEL 7, be sure to disable the "EUS" and "RT" yum repos, and
enable the "Optional" repo::

  # subscription-manager repos --disable=rhel-7-server-eus-rpms
  # subscription-manager repos --disable=rhel-7-server-rt-rpms
  # subscription-manager repos --enable=rhel-7-server-optional-rpms

Afterwards, just follow the installation steps as outlined for CentOS 7.

.. note::
  In order to allow external HTTP requests execute the following command::

    # $ sudo firewall-cmd --zone=public --add-port=80/tcp --permanent

Yum Repository Configuration
----------------------------

Download and install the ``openattic-release`` RPM package located in the
following directory::

  # yum install http://apt.openattic.org/rpm/openattic-nightly-el7-x86_64/openattic-release.rpm

To enable the nightly RPM builds, edit ``/etc/yum.repos.d/openattic.repo`` and
enable the ``[openattic-nightly]`` yum repository by setting ``enabled`` to
``1``.

|oA| Installation
-----------------

To install the packages on CentOS 7, run the following commands:

1. Disable SELinux::

     # setenforce 0

   Edit ``/etc/sysconfig/selinux`` and set ``SELINUX`` to ``disabled``.

2. Install packages::

     # yum install epel-release
     # yum install openattic

3. If you have installed your system's root and swap file systems on Logical
   Volumes, you can tag them to prevent |oA| from using them::

     # lvchange --addtag @sys /dev/centos/root
     # lvchange --addtag @sys /dev/centos/swap

4. Create a Volume Group for |oA| to use::

     # pvcreate /dev/sdb
     # vgcreate vgdata /dev/sdb

5. Install the database::

     # oaconfig install

6. Install the GUI

   The GUI is not installed automatically when using yum ``install
   openattic``, as it might not be required on each node of an |oA| cluster.
   Instead, it should be installed with the following command::

     # sudo yum install openattic-gui

Getting started
===============

In order to use the |oA| GUI, you need to run one last command in your
shell::

  # oaconfig add-disk /dev/<sdX> <vgname>

After running this command, the whole storage system can be managed by the user
interface - have fun!

Accessing the Web UI
--------------------

Open a web browser and navigate to http://yourhost/openattic/

Installing additional |oA| Modules
----------------------------------

After installing |oA|, you can install additional modules by using
``oaconfig install openattic-module-<module-name>``, i.e.::

  # oaconfig install openattic-module-drbd
  # oaconfig install openattic-module-btrfs
  # oaconfig install openattic-module-lio


Installing a cluster
--------------------

.. todo:: Waiting for feedback
