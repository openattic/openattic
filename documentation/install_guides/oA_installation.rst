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
* openSUSE Leap 42.1, SUSE Linux Enterprise Server 12 (SLES12) (via the
  openSUSE Build Service)
* Ubuntu Linux 14.04 LTS (Trusty)

.. note::
   |oA| has been designed to be installed on a 64-bit Linux operating system.
   Installation on 32-bit systems is not supported.

For testing |oA|, you should dedicate and prepare at least one additional
entire hard disk to it. See :ref:`basic storage configuration` for details.

When setting up a production server, there are a couple of things you should
be aware of when designing the system. See :ref:`storage recommendations` and
:ref:`hardware recommendations` for further details.

.. _base operating system installation:

Base Operating System Installation
==================================

The basic installation of the operating system (Linux distribution) depends on
your requirements and preferences and is beyond the scope of this document.

Consult the distribution's installation documentation for details on how to
perform the initial deployment.

We recommend performing a minimal installation that just installs the basic
operating system (no GUI, no development tools or other software not suitable
on a production system).

Post-installation Operating System Configuration
------------------------------------------------

After performing the base installation of your Linux distribution of choice,
the following configuration changes should be performed:

#. The system must be connected to a network and should be able to establish
   outgoing Internet connections, so additional software and regular OS
   updates can be installed.

#. Make sure the output of ``hostname --fqdn`` is something that makes sense,
   e.g.  ``srvopenattic01.yourdomain.com`` instead of ``localhost.localdomain``.
   If this doesn't fit, edit ``/etc/hostname`` and ``/etc/hosts`` to contain
   the correct names.

#. Install and configure an NTP daemon on every host, so the clocks on all
   these nodes are in sync.

#. HTTP access and other things might be blocked by the default firewall
   configuration. For example on EL7 system, execute the following commands::

     # firewall-cmd --permanent --zone=<your zone ie internal|public> --add-service=http
     # firewall-cmd --permanent --zone=<your zone ie internal|public> --add-service=samba
     # firewall-cmd --permanent --zone=<your zone ie internal|public> --add-service=nfs
     # firewall-cmd --permanent --zone=<your zone ie internal|public> --add-service=iscsi-target
     # firewall-cmd --reload

Consult your Linux distribution's documentation for further details on how to
make these changes.

.. _basic storage configuration:

Basic Storage Configuration
===========================

.. note::
  If you only want to use |oA| for managing and monitoring a Ceph cluster, you
  can skip the storage configuration. No additional local disks or storage
  pools are required for performing this functionality. After performing the
  basic |oA| software installation, follow the steps outlined in
  :ref:`enabling_ceph_support` to make your Ceph cluster known to |oA|.

At a minimum, |oA| should have one dedicated storage pool (e.g. an LVM volume
group or a ZFS zpool) for creating storage volumes. In the following chapters,
we'll explain how create an LVM volume group or, alternatively, a ZFS zpool.

Configuring storage for |oA| in a reliable and performant way depends on a
number of factors. See :ref:`storage recommendations` and :ref:`hardware
recommendations` for some recommendations.

.. note::
  Currently, |oA| requires that a storage pool (LVM or ZFS) has already been
  configured/prepared on the command line. This step has to be performed until
  the required functionality has been implemented in |oA| itself. See `OP-108
  <https://tracker.openattic.org/browse/OP-108>`_ and `OP-109
  <https://tracker.openattic.org/browse/OP-109>`_ for details.

Create an LVM Volume Group for |oA|
-----------------------------------

One way of managing storage with |oA| is using the Linux Logical Volume
Manager "LVM". The required command line tools are usually installed on a
Linux distribution by default. To learn more about LVM, consult your
distribution's documentation or the `LVM HOWTO
<http://tldp.org/HOWTO/LVM-HOWTO/>`_.

In the following steps, we'll create a logical volume group for |oA| to use.
The volume group name and device names may differ on your system.  In this
example, we'll use the second and third hard disk of the system, and create a
volume group named ``vgdata``::

  # vgcreate vgdata /dev/sdb /dev/sdc

Consult the :manpage:`lvm(8)` manual page and the LVM HOWTO for further
information on how to create volume groups and the supported modes of
redundancy and performance.

Tag OS Volume Groups / Logical Volumes
--------------------------------------

If you have installed your operating system's file systems on logical volumes
(which is the default for many distributions), you can tag these volumes or
the entire volume group with a ``sys`` tag to prevent |oA| from registering
them for usage when running ``oaconfig install``.

For example, on CentOS, you could run the following command to mark the entire
``centos`` volume group as reserved for the operating system::

  # vgchange --addtag sys centos

This will prevent the entire ``centos`` volume group from being registered for
management as a storage pool by |oA|.

Alternatively, you can tag selected logical volumes within the volume group::

  # lvchange --addtag sys centos/root
  # lvchange --addtag sys centos/swap

The ``centos`` volume group will be visible as a storage pool in |oA| and you
can create and manage volumes in there, except for the ``root`` and ``swap``
volumes.

Create a ZFS zpool
------------------

As an alternative to using LVM, |oA| also supports using the `OpenZFS
<http://open-zfs.org/>`_ file system for managing the underlying storage.

In order to use the ZFS file system, you need to install the required
filesystem driver modules for ZFS on Linux separately. Installation packages
for various Linux distributions are available from the `ZFS on Linux web site
<http://zfsonlinux.org/>`_. See the "Getting Started" pages on that site for
details on the distribution-specific installation steps.

Once ZFS on Linux has been installed and configured, a simple zpool for
testing purposes on a single disk could be created using the following
command::

  # zpool create -m /media/tank tank /dev/sdb

In a production environment, you should create a zpool across multiple disks
(e.g. in a RAID-1 configuration), to achieve the desired level of performance
and redundancy. See :ref:`storage recommendations` and the ZFS documentation
for recommendations.

.. note::
  The ZFS zpool needs to be mounted below ``/media/<poolname>`` in order for
  |oA| to manage it.

To enable ZFS support in |oA|, you also need to install the additional
``openattic-module-zfs`` package and run ``oaconfig install`` to register the
newly created zpool.

.. _installation on debian/ubuntu linux:

Installation on Debian/Ubuntu Linux
===================================

We provide installable DEB packages of |oA| via apt package repositories from
http://apt.openattic.org .

.. note::
  Before proceeding with the |oA| installation, make sure that you have
  followed the steps outlined in :ref:`base operating system installation` and
  :ref:`basic storage configuration`.

Importing the |oA| Keyfile
--------------------------

The |oA| packages are signed using a cryptographic key. You can import the
public GPG key from the download site using the following command:

::

  # wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -

The GPG key's fingerprint can be verified with ``apt-key finger`` and should
look as follows::

  pub   2048R/A7D3EAFA 2012-03-05
        Key fingerprint = 9A91 1EDD 45A2 4B25 9C39  E7D4 1D5C D44D A7D3 EAFA
  uid                  Business Critical Computing <is-bcc@it-novum.com>
  sub   2048R/A99076EE 2012-03-05

Enabling the |oA| Apt Package Repository
----------------------------------------

In order to add the |oA| apt repository, create a file named
``/etc/apt/sources.list.d/openattic.list``, and put the following lines into it.
Replace the field ``<distribution>`` with your distribution's short codename:

* ``jessie`` (for Debian 8 "Jessie")
* ``trusty`` (for Ubuntu 14.04 LTS "Trusty Thar")

::

  deb     http://apt.openattic.org/ <distribution>   main
  deb-src http://apt.openattic.org/ <distribution>   main

Enabling Nightly Builds
~~~~~~~~~~~~~~~~~~~~~~~

In addition to the offical releases, we also provide nightly builds, built off
the current "default" branch that will eventually become the next official |oA|
release.

To enable the nightly repo, the file ``/etc/apt/sources.list.d/openattic.list``
needs to be expanded to look as follows. Again, please replace ``<distribution>`` with your
distribution's code name as outlined above::

  deb     http://apt.openattic.org/ <distribution>   main
  deb-src http://apt.openattic.org/ <distribution>   main
  deb     http://apt.openattic.org/ nightly  main
  deb-src http://apt.openattic.org/ nightly  main

Package Installation
--------------------

After enabling the apt repository, run the following commands to install the
|oA| DEB packages::

  # apt-get update
  # apt-get install openattic

.. note::
  Installation of the ``openattic-gui`` package will replace the
  distribution's default ``index.html`` page in the Apache web server's
  document root with a redirect page to the |oA| web interface.

.. note::
  For **Ubuntu 14.04 LTS** it is necessary to install some extra package in
  order to get the ``lio-utils`` package working which is used by
  ``openattic-module-lio`` (installed by the base openattic package). You may
  need to restart the target service as well::

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

For the time being, SELinux needs to be disabled or put into "permissive" mode
when running |oA| (see `OP-543 <https://tracker.openattic.org/browse/OP-543>`_
for details).

On the command line, run the following command::

  # setenforce 0

To disable SELinux at system bootup, edit ``/etc/sysconfig/selinux`` and
change the configuration option ``SELINUX`` to ``permissive``.

Use the command ``getenforce`` to ensure that SELinux has been disabled
correctly.

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

.. note::
  Installation of the ``openattic-gui`` package will install an ``index.html``
  page in the Apache web server's document root that will redirect requests to
  the |oA| web interface.

Configure PNP4Nagios
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

To make sure that all changes have been applied correctly, please run ``nagios
--verify-config /etc/nagios/nagios.cfg`` afterwards, to verify the
configuration files for errors.

Nagios will be restarted during the |oA| installation and should then generate
the necessary RRD and XML files in ``/var/lib/pnp4nagios/<hostname>``.

Proceed with the installation by following the steps outlined in
:ref:`post-installation configuration`.

.. _installation on suse linux enterprise server and opensuse leap:

Installation on SUSE Linux Enterprise Server and openSUSE Leap
==============================================================

|oA| is available for installation on SUSE Linux Enterprise Server 12 (SLES12)
and openSUSE Leap 42 from the `openSUSE Build Service
<https://build.opensuse.org>`_.

The software is delivered in the form of RPM packages via dedicated yum
repositories named ``filesystems:openATTIC``.

.. note::
  Before proceeding with the |oA| installation, make sure that you have
  followed the steps outlined in :ref:`base operating system installation` and
  :ref:`basic storage configuration`.

Yum Repository Configuration
----------------------------

From a web browser, the installation of |oA| on SLES or Leap can be performed
via "1 Click Install" from the `openSUSE download site
<http://software.opensuse.org/package/openattic>`_.

From the command line, you can run the following command to enable the |oA|
package repository.

For openSUSE Leap 42.1 run the following as root::

  # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC/openSUSE_Leap_42.1/filesystems:openATTIC.repo
  # zypper refresh

For SLE 12 SP1 run the following as root::

  # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC/SLE_12_SP1/filesystems:openATTIC.repo
  # zypper refresh

For SLE 12 run the following as root::

  # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC/SLE_12/filesystems:openATTIC.repo
  # zypper refresh

Package Installation
--------------------

To install the |oA| base packages on SUSE Linux, run the following command::

  # zypper install openattic

The |oA| web GUI is not installed automatically when using ``zypper install
openattic``, as it might not be required on each node of an |oA| cluster.

It can be installed with the following command::

  # zypper install openattic-gui

Proceed with the installation by following the steps outlined in
:ref:`post-installation configuration`.
