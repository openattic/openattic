.. _quick start guide:

Quick Start Guide
=================

Since version 3.x, some Ceph management features of |oA| depend on a Ceph cluster
deployed and managed via  `DeepSea <https://github.com/SUSE/DeepSea>`_. To be
able to test the full feature set of |oA| you'll need to deploy a Ceph cluster,
services and |oA| with this framework. 

This "Quick Start Guide" will show you how to achieve this as fast as possible.

Requirements
------------

* Three VMs or bare metal nodes - our recommendation would be to have at least
  five or six nodes.
* Ideally, all node host names should follow a fixed naming convention, e.g.
  ``ceph-nn.yourdomain.com``
* Distribution: `openSUSE-Leap42.3 (x86_64)
  <http://download.opensuse.org/distribution/leap/42.3/iso/openSUSE-Leap-42.3-DVD-x86_64.iso>`_
* Firewall must be disabled on all nodes

Setup a Ceph cluster with DeepSea
---------------------------------

The way how to setup a Ceph cluster with DeepSea is well described in the
upstream `README <https://github.com/SUSE/DeepSea/blob/master/README.md>`_ and
the `DeepSea Wiki <https://github.com/SUSE/DeepSea/wiki>`_.

In this quick walkthrough we'll highlight the most important parts of the
installation. 

DeepSea uses `salt <https://github.com/saltstack/salt>`_ to deploy, setup and
manage the cluster. Therefore we have to define one of our nodes as the "master"
(management) node.

.. note::
  DeepSea currently only supports Salt 2016.11.04, while openSUSE Leap ships
  with a newer version (2017.7.2) by default. We therefore need to add a
  dedicated package repository that provides the older version and make sure
  that the package management system does not update it to a newer version by
  accident.

1. Log into the "master" node and run the following commands to add the
   DeepSea/openATTIC repository, install DeepSea and to start the ``salt-master``
   service::

    # zypper addrepo http://download.opensuse.org/repositories/filesystems:/ceph:/luminous/openSUSE_Leap_42.3/filesystems:ceph:luminous.repo
    # zypper addrepo http://download.opensuse.org/repositories/systemsmanagement:saltstack:products/openSUSE_Leap_42.3/systemsmanagement:saltstack:products.repo
    # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC:3.x/openSUSE_Leap_42.3/filesystems:openATTIC:3.x.repo
    # zypper refresh
    # zypper install salt-2016.11.04
    # zypper install deepsea
    # systemctl enable salt-master.service
    # systemctl start salt-master.service

2. Next, install and configure the ``salt-minion`` service on all your nodes
   (**including the "master" node**) with the following commands::

    # zypper addrepo http://download.opensuse.org/repositories/systemsmanagement:saltstack:products/openSUSE_Leap_42.3/systemsmanagement:saltstack:products.repo
    # zypper refresh
    # zypper install salt-minion-2016.11.04
    # zypper al 'salt*'

   Configure all minions to connect to the master. If your Salt master is not
   reachable by the host name "salt", edit the file ``/etc/salt/minion`` or
   create a new file ``/etc/salt/minion.d/master.conf`` with the following
   content::
   
    master: host_name_of_salt_master
   
   After you've changed the Salt minion configuration as mentioned above, start
   the Salt service on all Salt minions::
   
    # systemctl enable salt-minion.service
    # systemctl start salt-minion.service

3. Connect to your "master" node again:
   
   Check that the file ``/srv/pillar/ceph/master_minion.sls`` on the Salt master
   points to your Salt master and enable and start the Salt minion service on
   the master node::

    # systemctl enable salt-minion.service
    # systemctl start salt-minion.service

   Now accept all Salt keys on the Salt master::

   # salt-key --accept-all

   Verify that the keys have been accepted::

   # salt-key --list accepted

In order to avoid conflicts with other minions managed by the Salt master,
DeepSea needs to know which Salt minions should be considered part of the Ceph
cluster to be deployed.

This can be configured in file ``/srv/pillar/ceph/deepsea_minions.sls``, by
defining a naming pattern. By default, DeepSea targets all minions that have a
grain ``deepsea`` applied to them.

This can be accomplished by running the following Salt command on all
Minions that should be part of your Ceph cluster::

  # salt -L <list of minions> grains.append deepsea default

Alternatively, you can change ``deepsea_minions`` in ``deepsea_minions.sls`` to
any valid Salt target definition. See `man deepsea-minions` for details.

4. We can now start the Ceph cluster deployment from the "master" node:

   **Stage 0** - During this stage all required updates are applied and your
   systems may be rebooted::

   # deepsea stage run ceph.stage.0 

   **Stage 1** - The discovery stage collects all nodes and their hardware
   configuration in your cluster::

   # deepsea stage run ceph.stage.1

   Now you've to create a ``policy.cfg`` within ``/srv/pillar/ceph/proposals``.
   This file describes the layout of your cluster and how it should be deployed.
   
   You can find some examples `upstream
   <https://github.com/SUSE/DeepSea/tree/master/doc/examples>`_ as well as in
   the documentation included in the ``deepsea`` RPM package at
   ``/usr/share/doc/packages/deepsea/examples``. 
   
   For this deployment we've chosen the `rolebased policy
   <https://github.com/SUSE/DeepSea/blob/master/doc/examples/policy.cfg-rolebased>`_.
   Please change this file according to your environment. See ``man 5
   policy.cfg`` for details.

   **Stage 2** - The configuration stage parses the ``policy.cfg`` file and
   merges the included files into their final form::
   
   # deepsea stage run ceph.stage.2

   **Stage 3** - The actual deployment will be done::
   
   # deepsea stage run ceph.stage.3

   **Stage 4** - This stage will deploy all of the defined services within the
   ``policy.cfg``::
   
   # deepsea stage run ceph.stage.4

Congratulations, you're done! You can now reach the |oA| Web-UI on
"http://<your-master-node>.<yourdomain>
