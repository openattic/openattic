.. _installation on opensuse leap:

Installation on openSUSE Leap
=============================

|oA| is available for installation on openSUSE Leap 42.3 from the
`openSUSE Build Service <https://build.opensuse.org>`_.

The software is delivered in the form of RPM packages via a dedicated zypper
repository named ``filesystems:openATTIC:3.x``.

.. note::
  Before proceeding with the |oA| installation, make sure that you have
  followed the steps outlined in :ref:`base operating system installation`.

Zypper Repository Configuration
-------------------------------

From a web browser, the installation of |oA| on SLES or Leap can be performed
via "1 Click Install" from the `openSUSE download site
<http://software.opensuse.org/package/openattic>`_.

From the command line, you can run the following command to enable the |oA|
package repository.

For openSUSE Leap 42.3 run the following as root::

  # zypper addrepo http://download.opensuse.org/repositories/filesystems:/ceph:/luminous/openSUSE_Leap_42.3/filesystems:ceph:luminous.repo
  # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC:3.x/openSUSE_Leap_42.3/filesystems:openATTIC:3.x.repo
  # zypper refresh

.. note:: 
  If you're interested in testing the latest state of the master branch (which is our development branch) 
  please add the following repositories to your system::

    # zypper addrepo http://download.opensuse.org/repositories/filesystems:/ceph:/luminous/openSUSE_Leap_42.3/filesystems:ceph:luminous.repo
    # zypper addrepo http://download.openattic.org/rpm/openattic-nightly-master-openSUSE_Leap_42.3-x86_64/ openattic_repo
    # rpm --import http://download.openattic.org/A7D3EAFA.txt
    # zypper refresh
    # zypper dist-upgrade
  
Package Installation
--------------------

To install the |oA| base packages on SUSE Linux, run the following command::

  # zypper install openattic

Proceed with the installation by following the steps outlined in :ref:`post-installation configuration`.
