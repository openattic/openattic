System requirements
===================

|oA| can be installed on the most popular Linux distributions. It is designed
to run on commodity hardware, so you are not in any way bound to a specific
vendor or hardware model.

You need to make sure that your Linux distribution of choice supports the
hardware you intend to use. Check the respective hardware compatibility lists
or consult your hardware vendor for details.

Installable packages of |oA| are currently available for the following Linux
distributions:

* Debian Linux 8 (Jessie)
* Red Hat Enterprise Linux 7 (RHEL) and derivatives (CentOS 7, Oracle Linux 7
  or Scientific Linux 7)
* openSUSE Leap 42.1, SUSE Linux Enterprise Server 12 (SLES12)
* Ubuntu Linux 14.04 LTS (Trusty)

.. note::
   |oA| has been designed to be installed on a 64-bit Linux operating system.
   Installation on 32-bit systems is not supported.

For testing |oA|, you should dedicate at least one additional entire hard disk
to it. See :ref:`basic storage configuration` for details.

When setting up a production server, there are a couple of things you should
be aware of when designing the system. See :ref:`storage recommendations` and
:ref:`hardware recommendations` for further details.

In order to use the ZFS file system, you need to install ZFS on Linux
separately. Installation packages for various Linux distributions are
available from the `ZFS on Linux web site <http://zfsonlinux.org/>`_.

.. _base operating system installation:

Base Operating System Installation
==================================

The basic installation of the operating system (Linux distribution) depends on
your requirements and preferences and is beyond the scope of this document.

Consult the distribution's installation documentation for details on how to
perform the initial deployment.

We recommend performing a minimal installation that just installs the basic
operating system (no GUI, no development tools and other software not suitable
on a production system).

Post-install Operating System Configuration
-------------------------------------------

After performing the base installation of your Linux distribution of choice,
the following configuration changes should be performed:

#. The system must be connected to a network and should be able to establish
   outgoing Internet connections, so additional software and regular OS
   updates can be installed.

#. Make sure the output of ``hostname --fqdn`` is something that makes sense,
   e.g.  ``srvopenattic01.example.com`` instead of ``localhost.localdomain``.
   If this doesn't fit, edit ``/etc/hostname`` and ``/etc/hosts`` to contain
   the correct names.

#. Install and configure an NTP daemon on every host, so the clocks on all
   these nodes are in sync.

#. HTTP access to the Web UI might be blocked by the default firewall
   configuration. For example, in order to allow external HTTP requests on an
   EL7 system, execute the following commands::

     # firewall-cmd --zone=public --add-port=80/tcp --permanent
     # systemctl restart firewalld

Consult your Linux distribution's documentation for further details on how to
make these changes.

.. _basic storage configuration:

Basic Storage Configuration
===========================

At a minimum, |oA| should have one dedicated storage pool (e.g. an LVM volume
group or a ZFS zpool) for creating storage volumes. In the following chapter,
we'll create an LVM volume group.

Configuring storage for |oA| depends on a number of factors. See :ref:`storage
recommendations` and :ref:`hardware recommendations` for further details.

.. note::
  Currently, |oA| requires that the storage pool has already been configured
  on the command line. This step has to be performed until the required
  functionality has been implemented. See `OP-108
  <https://tracker.openattic.org/browse/OP-108>`_ and `OP-109
  <https://tracker.openattic.org/browse/OP-109>`_ for details.

Create a Volume Group for |oA|
------------------------------

Now create a logical volume group for |oA| to use.

The volume group name and device names may differ on your system.

In the following example, we'll use the second and third hard disk of the
system, and create a volume group named ``vgdata``::

  # vgcreate vgdata /dev/sdb /dev/sdc

Consult the :manpage:`lvm(8)` manual page and the `Linux LVM documentation
<http://www.tldp.org/HOWTO/LVM-HOWTO/index.html>`_ for further information on
how to create volume groups and the supported modes of redundancy and
performance.

Tag OS Volume Groups / Logical Volumes
--------------------------------------

If you have installed your operating system's file systems on logical volumes
(which is the default for many distributions), you can tag these volumes or
the entire volume group with a ``sys`` tag to prevent |oA| from registering
them for usage by ``oaconfig install``.

For example, on CentOS, you could run the following command to mark the entire
``centos`` volume group as reserved for the operating system::

  # vgchange --addtag sys centos

This will prevent the entire ``centos`` volume group from being registered for
management by |oA|.

Alternatively, you can tag selected logical volumes within the volume group::

  # lvchange --addtag sys centos/root
  # lvchange --addtag sys centos/swap

The ``centos`` volume group will be visible in |oA| and you can create and
manage volumes in there, except for the ``root`` and ``swap`` volumes.

.. _installation on debian/ubuntu linux:

Installation on Debian/Ubuntu Linux
===================================

We provide installable DEB packages of |oA| via apt package repositories from
http://apt.openattic.org .

.. note::
  Before proceeding with the |oA| installation, make sure that you have
  followed the steps outlined in :ref:`base operating system installation` and
  :ref:`basic storage configuration`.

Enabling the |oA| Apt package repository
----------------------------------------

In order to use enable the |oA| Apt repository, create a file named
``/etc/apt/sources.list.d/openattic.list``, and put the following lines into
it:

For Debian 8 (Jessie)
~~~~~~~~~~~~~~~~~~~~~

::

  deb     http://apt.openattic.org/ jessie   main
  deb-src http://apt.openattic.org/ jessie   main

For Ubuntu 14.04 LTS (Trusty)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

  deb     http://apt.openattic.org/ trusty   main
  deb-src http://apt.openattic.org/ trusty   main

Enabling Nightly Builds
~~~~~~~~~~~~~~~~~~~~~~~

In addition to the offical releases, we also provide nightly builds, build off
the current "default" branch that will become the next official |oA| release.

Add the following to the existing ``/etc/apt/sources.list.d/openattic.list``
file::

  deb     http://apt.openattic.org/ nightly  main
  deb-src http://apt.openattic.org/ nightly  main

Importing the |oA| Keyfile
~~~~~~~~~~~~~~~~~~~~~~~~~~

The |oA| packages are signed using a cryptographic key. You can import the
public GPG key from the download site using the following command:

::

  # wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -

The GPG key's fingerprint should look as follows::

  pub   2048R/A7D3EAFA 2012-03-05
        Key fingerprint = 9A91 1EDD 45A2 4B25 9C39  E7D4 1D5C D44D A7D3 EAFA
  uid                  Business Critical Computing <is-bcc@it-novum.com>
  sub   2048R/A99076EE 2012-03-05

Package Installation
--------------------

After enabling the apt repository, run the following commands to install the
|oA| DEB packages::

  # apt-get update
  # apt-get install openattic

.. note::
  For **Ubuntu 14.04 LTS** it is necessary to install some extra package in order
  to get the ``lio-utils`` package working which is used by ``openattic-module-lio``
  (included in the base openattic package).
  You may need to restart the target service as well::
    # apt-get install linux-image-extra-`uname -r`
    # service target restart

Proceed with the installation by following the steps outlined in
:ref:`post-installation configuration`.

.. _installation on red hat enterprise linux (and derivatives):

Installation on Red Hat Enterprise Linux (and Derivatives)
==========================================================

Starting with version 2.0, |oA| is also available for RPM-based Linux
distributions, namely Red Hat Enterprise Linux 7 (RHEL) and derivatives (e.g.
CentOS 7, Oracle Linux 7 or Scientific Linux 7). For the sake of simplicy, we
refer to these distributions as Enterprise Linux 7 (EL7).

The software is delivered in the form of RPM packages via dedicated yum
repositories.

.. note::
  Before proceeding with the |oA| installation, make sure that you have
  followed the steps outlined in :ref:`base operating system installation` and
  :ref:`basic storage configuration`.

Preliminary Preparations on RHEL 7
----------------------------------

.. note::
  This step is not required on CentOS and other RHEL derivatives.

To install on RHEL 7, be sure to disable the "EUS" and "RT" yum repos, and
enable the "Optional" repo::

  # subscription-manager repos --disable=rhel-7-server-eus-rpms
  # subscription-manager repos --disable=rhel-7-server-rt-rpms
  # subscription-manager repos --enable=rhel-7-server-optional-rpms

Afterwards, just continue with the following installation steps.

Disable SELinux
---------------

For the time being, SELinux needs to be disabled or put into "permissive"
mode, see `OP-543 <https://tracker.openattic.org/browse/OP-543>`_ for details.

On the command line, run the following command::

  # setenforce 0

To disable SELinux at system bootup, edit ``/etc/sysconfig/selinux`` and
change the configuration option ``SELINUX`` to ``permissive``.

Yum Repository Configuration
----------------------------

|oA| requires some additional packages that are not part of the official EL7
distribution, but can be obtained from the Extra Packages for Enterprise Linux
(`EPEL <https://fedoraproject.org/wiki/EPEL>`_) yum repository.

To enable the EPEL repository, you need to run the following command::

  # yum install epel-release

Download and install the ``openattic-release`` RPM package located in the
following directory::

  # yum install http://repo.openattic.org/rpm/openattic-2.x-el7-x86_64/openattic-release.rpm

This will automatically enable package installation from the |oA| Release
repository.

To enable the nightly RPM builds, edit ``/etc/yum.repos.d/openattic.repo`` and
enable the ``[openattic-nightly]`` yum repository by setting ``enabled`` to
``1``.

Package Installation
--------------------

To install the |oA| base packages on EL7, run the following command::

  # yum install openattic

The |oA| web GUI is not installed automatically when using ``yum install
openattic``, as it might not be required on each node of an |oA| cluster.

It can be installed with the following command::

  # yum install openattic-gui

Configure pnp4nagios
--------------------

|oA| uses `Nagios <https://www.nagios.org/>`_ and the `PNP4Nagios
<http://pnp4nagios.org/>`_ addon for analyzing performance data and generating
graphs to display the performance and utilization of disks and volumes.

By default, PNP4Nagios is configured by |oA| automatically to run in `bulk
mode with npcdmod
<http://docs.pnp4nagios.org/pnp-0.6/modes#bulk_mode_with_npcdmod>`_ to process
performance data.

Unfortunately Nagios in the EPEL repository has been updated to version 4.0.x
some time ago, which does no longer support this mode. See `OP-820
<https://tracker.openattic.org/browse/OP-820>`_ for more details.

Instead, PNP4Nagios on EL7 needs to be configured manually for using `bulk
mode with NPCD
<http://docs.pnp4nagios.org/pnp-0.6/modes#bulk_mode_with_npcd>`_, by following
the steps outlined below.

Append the following to ``/etc/nagios/nagios.cfg``::

  #
  # Bulk / NPCD mode
  #

  # *** the template definition differs from the one in the original nagios.cfg
  #
  service_perfdata_file=/var/log/pnp4nagios/service-perfdata
  service_perfdata_file_template=DATATYPE::SERVICEPERFDATA\tTIMET::$TIMET$\tHOSTNAME::$HOSTNAME$\tSERVICEDESC::$SERVICEDESC$\tSERVICEPERFDATA::$SERVICEPERFDATA$\tSERVICECHECKCOMMAND::$SERVICECHECKCOMMAND$\tHOSTSTATE::$HOSTSTATE$\tHOSTSTATETYPE::$HOSTSTATETYPE$\tSERVICESTATE::$SERVICESTATE$\tSERVICESTATETYPE::$SERVICESTATETYPE$
  service_perfdata_file_mode=a
  service_perfdata_file_processing_interval=15
  service_perfdata_file_processing_command=process-service-perfdata-file

  # *** the template definition differs from the one in the original nagios.cfg
  #
  host_perfdata_file=/var/log/pnp4nagios/host-perfdata
  host_perfdata_file_template=DATATYPE::HOSTPERFDATA\tTIMET::$TIMET$\tHOSTNAME::$HOSTNAME$\tHOSTPERFDATA::$HOSTPERFDATA$\tHOSTCHECKCOMMAND::$HOSTCHECKCOMMAND$\tHOSTSTATE::$HOSTSTATE$\tHOSTSTATETYPE::$HOSTSTATETYPE$
  host_perfdata_file_mode=a
  host_perfdata_file_processing_interval=15
  host_perfdata_file_processing_command=process-host-perfdata-file

Add the following to ``/etc/nagios/objects/commands.cfg``::

  #
  # definitions for PNP processing commands
  # Bulk with NPCD mode
  #
  define command {
   command_name process-service-perfdata-file
   command_line /bin/mv /var/log/pnp4nagios/service-perfdata /var/spool/pnp4nagios/service-perfdata.$TIMET$
  }

  define command {
   command_name process-host-perfdata-file
   command_line /bin/mv /var/log/pnp4nagios/host-perfdata /var/spool/pnp4nagios/host-perfdata.$TIMET$
  }

Nagios will be restarted during the |oA| installation and should then generate
the necessary RRD and XML files in ``/var/lib/pnp4nagios/<hostname>``.

.. _post-installation configuration:

Post-installation Configuration
===============================

|oA| base configuration
-----------------------

After all the required packages have been installed, you need to perform the
actual |oA| configuration, by running ``oaconfig``::

  # oaconfig install

``oaconfig install`` will start a number of services, initialize the |oA|
database and scan the system for pools and volumes to include.

Changing the openattic User Password
------------------------------------

By default, ``oaconfig`` creates an adminstrative user account ``openattic``,
with the same password.

As a security precaution, we strongly recommend to change this password
immediately::

  # oaconfig changepassword openattic
  Changing password for user 'openattic'
  Password: <enter password>
  Password (again): <re-enter password>
  Password changed successfully for user 'openattic'

Now, your |oA| storage system can be managed by the user interface - have fun!

Getting started
===============

Accessing the Web UI
--------------------

|oA| can be managed using a web-based user interface.

Open a web browser and navigate to http://openattic.yourdomain.com/openattic

The default login username is "openattic". Use the password you defined during
the :ref:`post-installation configuration`.

See the :ref:`gui_docs_index` for further information.

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
