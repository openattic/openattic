.. _post-installation configuration:

Post-installation Configuration
===============================

|oA| Base Configuration
-----------------------

After all the required packages have been installed and a storage pool has
been created, you need to perform the actual |oA| configuration, by running
``oaconfig``::

  # oaconfig install

``oaconfig install`` will start and enable a number of services, initialize
the |oA| database and scan the system for pools and volumes to include.

Changing the Default User Password
----------------------------------

By default, ``oaconfig`` creates a local adminstrative user account
``openattic``, with the same password.

As a security precaution, we strongly recommend to change this password
immediately::

  # oaconfig changepassword openattic
  Changing password for user 'openattic'
  Password: <enter password>
  Password (again): <re-enter password>
  Password changed successfully for user 'openattic'

Now, your |oA| storage system can be managed via the user interface.

See :ref:`getting started` for instructions on how to access the web user
interface.

If you don't want to manage your users locally, consult the chapter
:ref:`admin_auth_methods` for alternative methods for authentication and
authorization.

Installing additional |oA| Modules
----------------------------------

After installing |oA|, you can install additional modules
(``openattic-module-<module-name>``), by using your operating system's native
package manager, i.e.::

  # apt-get install openattic-module-drbd # Debian/Ubuntu
  # yum install openattic-module-btrfs # RHEL/CentOS

.. note::
  Don't forget to run ``oaconfig install`` after installing new modules.

Enabling Ceph Support in |oA|
-----------------------------

.. note::
  |oA| currently supports Ceph "Jewel" (or newer). Older Ceph versions may not
  work.

To set up |oA| with Ceph you first have to copy the Ceph administrator keyring
and configuration from your Ceph admin node to your |oA| system.

From your Ceph admin node, you can perform this step by using ``ceph-deploy``
(assuming that you can perform SSH logins from the admin node into the
|oA| host)::

  # ceph-deploy admin openattic.yourdomain.com

On the |oA| node, you should then have the following files::

  /etc/ceph/ceph.client.admin.keyring
  /etc/ceph/ceph.conf

Alternatively, you can copy these files manually.

The next step is to install the |oA| Ceph module on your system::

  # apt-get install openattic-module-ceph
  - or -
  # yum install openattic-module-ceph

The last step is to recreate your |oA| configuration::

  # oaconfig install
