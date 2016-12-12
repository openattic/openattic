.. _installing_a_multi-node_system:

Installing an |oA| Multi-node System
====================================

|oA| can be installed in a multi-node setup, in which any node can be used to
manage the whole system and commands are distributed to the approprate node
automatically. This is implemented by using a shared configuration database,
connecting all |oA| nodes to the same PostgreSQL database.

This is usually the database of the first node that you installed and
configured, but can be a database running on a dedicated node, too.

In order to use DRBD |reg|, you will need a set up a multi-node setup consisting
of **two** hosts.

.. note::

	Note that multinode support currently applies to the "traditional" storage
	management functionality of |oA| only. For managing Ceph, you need to
	connect to the web interface of the |oA| node configured to connect to the
	Ceph cluster directly.

Step 1 - Install Two |oA| Hosts
-------------------------------

In the following example the first host is called **openattic01.yourdomain.com**
(IP address: 192.168.1.101) and the second **openattic02.yourdomain.com** (IP
address: 192.168.1.102). Both hosts should be able to connect to each other
using their host names, so make sure that DNS is configured correctly (or you
have configured ``/etc/hosts`` accordingly on both nodes).

Note that these two systems don't necessarily need to have the exact same
specifications (e.g. hardware, hard disks). However, the version of |oA| running
on these hosts should be identical. In the example below, Debian Linux is
assumed as the operating system. The path names to configuration files and some
configuration details (e.g. PostgreSQL or firewall configuration) might differ
on other platforms.

As a first step, you should setup and install these two |oA| hosts as described
in :ref:`install_guides_index`.

.. note::
	
	You should only perform the :ref:`post-installation configuration` on
	**one** of the two hosts first! In the following example the command was
	executed on host **openattic01**. This will result in the installation of
	the entire |oA| system including the database.

Step 2 - Remote Database Configuration on **openattic02**
---------------------------------------------------------

Since **openattic02** needs to connect to the database of **openattic01** you
will have to enter the database information (database name, user, password and
host) from **openattic01** into the database configuration file
``/etc/openattic/database.ini`` on **openattic02** manually. The password can
be obtained from the ``database.ini`` file on **openattic01**.

The ``database.ini`` file on **openattic02** should look something like this::

	[default]
	engine   = django.db.backends.postgresql_psycopg2
	name     = openattic
	user     = openattic
	password = <password>
	host     = openattic01.yourdomain.com
	port     =

Step 3 - Database Configuration on **openattic01**
--------------------------------------------------

Next, the PostgreSQL database configuration on **openattic01** needs to be
adjusted so it accepts incoming remote connection attempts from **openattic02**.

Edit the ``/etc/postgresql/<VERSION>/main/postgresql.conf`` and
``/etc/postgresql/<VERSION>/main/pg_hba.conf`` configuration files on
**openattic01**.

.. note::

	The location of these files might be different on other Linux distributions.

First, set the correct listen addresses within the ``postgres.conf`` file. Add
**openattic01**'s external IP address to ``listen_addresses`` and uncomment this
configuration setting::

   #------------------------------------------------------------------------------
   # CONNECTIONS AND AUTHENTICATION
   #------------------------------------------------------------------------------

   # - Connection Settings -

   listen_addresses = 'localhost, 192.168.1.101'  # what IP address(es) to listen on;
                                    # comma-separated list of addresses;
                                    # defaults to 'localhost'; use '*' for all

.. note::

	On some operating systems, the firewall configuration might prevent external
	communication requests to the TCP port used by PostgreSQL (5432 by default).
	Please consult your distribution's documentation on how to configure the
	firewall to accept incoming connections from **openattic02** to this port.

Next, you need to add **openattic02** to PostgreSQL's client authentication
configuration file ``pg_hba.conf``. Edit the file and add the following line to
the IPv4 local connections section as follows::

  # IPv4 local connections:
  host    all             all             127.0.0.1/32            md5
  host    openattic       openattic       192.168.1.102/32        md5

This ensures that PostgreSQL accepts authentication requests to the local
``openattic`` database from the remote host **openattic02**.

You need to restart the PostgreSQL service on **openattic01** afterwards, to
apply these settings::

  # systemctl restart postgresql

Step 4 - Execute ``oaconfig install`` on **openattic02**
--------------------------------------------------------

Now that you have configured **openattic02** to connect to **openattic01**'s
database, you can conclude the |oA| install on **openattic02** by executing
``oaconfig install`` there.

If everything worked out well, you should now see both **openattic01** and
**openattic02** in the **Hosts** tab of the web UI running on **openattic01**
(and **openattic02** respectively), and the disks, pools and volumes of both
hosts should also be visible.