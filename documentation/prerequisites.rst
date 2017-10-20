Prerequisites
=============

|oA| can be installed on Linux only. It is designed to run on commodity
hardware, so you are not in any way bound to a specific vendor or hardware
model.

You need to make sure that your Linux distribution of choice supports the
hardware you intend to use. Check the respective hardware compatibility lists
or consult your hardware vendor for details.

Supported distributions
-----------------------

Installable packages of |oA| |version| are currently available for the following
Linux distributions:

* openSUSE Leap 42.3 (via the openSUSE Build Service) - see
  :ref:`installation on opensuse leap` for details.

.. note::
   |oA| has been designed to be installed on a 64-bit Linux operating system.
   Installation on 32-bit systems is not supported.

.. _base operating system installation:

Base Operating System Installation
----------------------------------

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

#. HTTP access might be blocked by the default firewall configuration. Make sure
   to update the configuration in order to enable HTTP access to the |oA|
   API/Web UI.

Consult your Linux distribution's documentation for further details on how to
make these changes.
