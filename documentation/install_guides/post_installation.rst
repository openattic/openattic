.. _post-installation configuration:

Post-installation Configuration - (Manual deployment)
=====================================================

If you want to use |oA| without DeepSea or if you've deployed oA and DeepSea
independently you have to configure a few things manually. Also be aware of that
only a subset of the management functionality is available without DeepSea, e.g.
the NFS Ganesha or iSCSI target configuration.

.. _enabling_ceph_support:

Enabling Basic Ceph Support in |oA|
-----------------------------------

|oA| depends on Ceph's `librados Python bindings
<http://docs.ceph.com/docs/master/rados/api/python/>`_ for performing many Ceph
management and monitoring tasks, e.g. the management of Ceph Pools or RADOS
block devices.

.. note::
  Ceph support in |oA| is currently developed against Ceph 12.1.0 aka
  "Luminous". Older Ceph versions may not work as expected. If your Linux
  distribution ships an older version of Ceph (as most currently do), please
  either use the `upstream Ceph package repositories
  <http://docs.ceph.com/docs/master/install/get-packages/>`_ or find an
  alternative package repository for your distribution that provides a version
  of Ceph that meets the requirements. Note that this applies to both the
  version of the Ceph tools installed on the |oA| node as well as the version
  running on your Ceph cluster.

To set up |oA| with Ceph you first have to copy the Ceph administrator keyring
and configuration from your Ceph admin node to your local |oA| system.

From your Ceph admin node, you can perform this step by using ``ceph-deploy``
(assuming that you can perform SSH logins from the admin node into the
|oA| host)::

  # ceph-deploy admin openattic.yourdomain.com

On the |oA| node, you should then have the following files::

  /etc/ceph/ceph.client.admin.keyring
  /etc/ceph/ceph.conf

.. note::
  Please ensure that these files are actually readable by the |oA| system user
  (``openattic`` by default). This could be done by making them readable by the
  ``openattic`` user group::

    # chgrp openattic /etc/ceph/ceph.conf /etc/ceph/ceph.client.admin.keyring
    # chmod g+r /etc/ceph/ceph.conf /etc/ceph/ceph.client.admin.keyring

Alternatively, you can copy these files manually.

.. note::
  |oA| partially supports managing multiple Ceph clusters, provided they have
  different names and FSIDs. You can add another cluster by copying the
  cluster's admin keyring and configuration into ``/etc/ceph`` using a different
  cluster name, e.g. ``development`` instead of the default name ``ceph``::

    /etc/ceph/development.client.admin.keyring
    /etc/ceph/development.conf

It is also possible to configure a Ceph cluster's configuration and keyring file
in the settings file ``/etc/sysconfig/openattic``.

``CEPH_CLUSTERS`` is a string setting containing paths to ``ceph.conf`` files.
Multiple clusters can be added by seperating them with a ``;`` sign like so::

  CEPH_CLUSTERS="/etc/ceph/ceph.conf;/home/user/ceph/build/ceph.conf"

For each Ceph cluster, one can set the path to the keyring file by adding
``CEPH_KEYRING_`` appended by the uppercase cluster fsid as follows::

    CEPH_KEYRING_123ABCDE_4567_ABCD_1234_567890ABCDEF="/home/user/ceph/build/keyring"

It is also possible to define a specific user name for each cluster, by adding
``CEPH_KEYRING_USER_`` appended by the uppercase cluster fsid, like so::

  CEPH_KEYRING_USER_123ABCDE_4567_ABCD_1234_567890ABCDEF="client.openattic"

The last step is to recreate your |oA| configuration::

  # oaconfig install

.. _deepsea_integration:

DeepSea integration in |oA|
---------------------------

`DeepSea <https://github.com/SUSE/DeepSea>`_ is a Ceph installation and
management framework developed by SUSE which is based on the `Salt Open
<https://saltstack.com/salt-open-source/>`_ automation and orchestration
software. It highly automates the deployment, configuration and management of an
entire Ceph cluster and all of its components.

Some |oA| features like iSCSI target and Ceph object gateway (RGW) management
depend on communicating with DeepSea via the Salt REST API.

To enable the REST API of DeepSea you would have to issue the following command
on the Salt master node::

  salt-call state.apply ceph.salt-api

By default, |oA| assumes that Salt master hostname is ``salt``, API port is ``8000``
and API username is ``admin``. If you need to change any of this default values, you
should configure it in either ``/etc/default/openattic`` for Debian-based
distributions or in ``/etc/sysconfig/openattic`` for RedHat-based distributions
as well as SUSE Linux.

Available settings are::

  SALT_API_HOST="salt"
  SALT_API_PORT="8000"
  SALT_API_USERNAME="admin"
  SALT_API_PASSWORD="admin"

.. caution::

  Do not use spaces before or after the equal signs

Ceph Object Gateway management features
---------------------------------------

If you want to enable the Ceph Object Gateway management features, and you are using
DeepSea, you just have to guarantee that the Salt REST API is correctly
configured (see :ref:`deepsea_integration`). In case you are not using DeepSea,
you have to configure the Rados Gateway manually by editing either
``/etc/default/openattic`` for Debian-based distributions or
``/etc/sysconfig/openattic`` for RedHat-based distributions as well as SUSE
Linux.

This is an example for the manually configured Rados Gateway credentials::

  RGW_API_HOST="ceph-1"
  RGW_API_PORT=80
  RGW_API_SCHEME="http"
  RGW_API_ACCESS_KEY="VFEG733GBY0DJCIV6NK0"
  RGW_API_SECRET_KEY="lJzPbZYZTv8FzmJS5eiiZPHxlT2LMGOMW8ZAeOAq"

.. note::

   If your Rados Gateway admin resource isn't configured to use the default
   value ``admin`` (e.g. http://host:80/admin), you will need to also set the
   ``RGW_API_ADMIN_RESOURCE`` option appropriately.

You can obtain these credentials by issuing the ``radosgw-admin`` command like
so::

  radosgw-admin user info --uid=admin

|oA| Base Configuration
-----------------------

After all the required packages have been installed, you need to perform the
actual |oA| configuration, by running ``oaconfig``::

  # oaconfig install

``oaconfig install`` will start and enable a number of services, initialize
the |oA| database and scan the system for.

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

See :ref:`accessing the webui` for instructions on how to access the web user
interface.

If you don't want to manage your users locally, consult the chapter
:ref:`admin_auth_methods` for alternative methods for authentication and
authorization.
