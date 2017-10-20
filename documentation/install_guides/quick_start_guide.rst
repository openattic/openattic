.. _quick start guide:

Quick Start Guide
=================

Since |oA| 3.x we've a closer relationship with `DeepSea <https://github.com/SUSE/DeepSea>`_. To be able to test the full feature set of |oA| you'll need to deploy a ceph cluster, services and |oA| with DeepSea. 

This "Quick Start Guide" will show you how to achieve this as fast as possible.

Requirements
------------

* Three VMs or bare metal nodes - our recommendation would be to have at least five or six nodes
* Distribution: `openSUSE-Leap42.3 (x86_64) <http://download.opensuse.org/distribution/leap/42.3/iso/openSUSE-Leap-42.3-DVD-x86_64.iso>`_
* Firewall must be disabled on all nodes

Setup a Ceph cluster with DeepSea
---------------------------------

The way how to setup a ceph cluster with DeepSea is well described 
in the upstream `README <https://github.com/SUSE/DeepSea/blob/master/README.md>`_.

In this quick walkthrough we'll highlight the most important parts of the installation. 

DeepSea uses `salt <https://github.com/saltstack/salt>`_ to deploy, setup and manage the cluster. Therefor we have to define one of our nodes as the "master" (management) node.

1. Connect to the "master" node and run the following commands to add the DeepSea/openATTIC
repository, install DeepSea and to start the salt-master service::

   # zypper ar http://download.opensuse.org/repositories/filesystems:/ceph:/luminous/openSUSE_Leap_42.3/filesystems:ceph:luminous.repo
   # zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC:3.x/openSUSE_Leap_42.3/filesystems:openATTIC:3.x.repo
   # zypper ref
   # zypper in deepsea
   # systemctl enable salt-master.service
   # systemctl start salt-master.service

2. Connect to all your "clients" to install and configure 
   the salt-minion with the following commands::
   
   # zypper in salt-minion
   
   Configure all minions (including the master minion) to connect to the master. 
   If your Salt master is not reachable by the host name "salt", edit the file 
   /etc/salt/minion or create a new file /etc/salt/minion.d/master.conf with 
   the following content::
   
   # master: host_name_of_salt_master
   
   If you performed any changes to the configuration files mentioned above, 
   restart the Salt service on all Salt minions::
   
   # systemctl restart salt-minion.service

3. Connect to your "master" node again:
   
   Check that the file /srv/pillar/ceph/master_minion.sls on the Salt master points to your Salt master::

   # systemctl restart salt-minion.service

   Accept all salt keys on the Salt master::

   # salt-key --accept-all

   Verify that the keys have been accepted::

   # salt-key --list-all

4. Still on the "master" node we can now start with the cluster deployment:

   Stage 0 - During this stage all required updates are applied and your system may be rebooted::

   # deepsea stage run ceph.stage.0 

   Stage 1 - The discovery stage collects all hardware in your cluster::

   # deepsea stage run ceph.stage.1

   Now you've to create a policy.cfg within "/srv/pillar/ceph/proposals". 
   This file describes the layout of your cluster and how it should be deployed. 
   You can find some examples `upstream <https://github.com/SUSE/DeepSea/tree/master/doc/examples>`_. 
   For this deployment we've choosed the `rolebased <https://github.com/SUSE/DeepSea/blob/master/doc/examples/policy.cfg-rolebased>`_. Please change this file to your needs.

   Stage 2 - The configuration stage parses the policy.cfg file and merges the included files into their final form::
   
   # deepsea stage run ceph.stage.2

   Stage 3 - The deployment will be done::
   
   # deepsea stage run ceph.stage.3

   Stage 4 - This stage will deploy all of the defined services within the policy.cfg::
   
   # deepsea stage run ceph.stage.4

Congratulations, you're done. You can now reach the |oA| Web-UI on "http://$your-master-node"
