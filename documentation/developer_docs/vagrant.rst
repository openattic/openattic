.. _developer_vagrant_howto:

Setting up a Development System with Vagrant
============================================

Setting up a development system using `Vagrant <https://www.vagrantup.com/>`_ is by far the easiest
way to start developing on |oa|. However, we also provide instructions for setting up a classical
development environment in :ref:`developer_setup_howto`. Our Vagrant setup uses either a
VirtualBox or a KVM/libvirt VM as base image. You will need to install at least one of them.

For example, KVM/libvirt can be installed on Ubuntu by running::

    sudo apt-get install qemu-kvm

.. _developer_hg_howto:

Create Your own |oA| Fork
-------------------------

The |oA| source code is managed using the `Mercurial
<https://www.mercurial-scm.org/>`_ distributed source control management tool.
Mercurial offers you a full-fledged version control, where you can commit and
manage your source code locally and also exchange your modifications with
other developers by pushing and pulling change sets across repositories.

If you're new to Mercurial, take a look at the `Learn Mercurial
<https://www.mercurial-scm.org/learn>`_ web site. This will teach you the
basics of how to get started.

The |oA| source code repository is publicly hosted in a `Mercurial Repository
on BitBucket <https://bitbucket.org/openattic/openattic/>`_.

A "fork" is a remote Mercurial clone of a repository. Every |oA| developer
makes code modifications on a local |oA| fork before they are merged into
the main repository. See :ref:`developer_contribute` for instructions on how
to get your code contributions included in the |oA| main repository.

It is possible to create a local clone of the |oA| repository by simply
running ``hg clone https://bitbucket.org/openattic/openattic``.

However, if you would like to collaborate with the |oA| developers, you should
consider creating a user account on BitBucket and create a "Fork".

Take a look at the `BitBucket Documentation
<https://confluence.atlassian.com/bitbucket/bitbucket-cloud-documentation-home-221448814.html>`_
for instructions on how to create a free BitBucket account. We require real
user names over pseudonyms when working with contributors.

Once you are logged into BitBucket, go to `the openATTIC main repository
<https://bitbucket.org/openattic/openattic>`_ and click **Fork** on the left
side under **ACTIONS**. Now you should have your own |oA| fork, which will
be used to create a local copy (clone). You can find your repository's SSH or
HTTPS URL in the top right corner of the repository overview page.


Installation
------------

Please follow the official documentation for
`installing Vagrant <https://www.vagrantup.com/docs/installation/>`_. After installing Vagrant,
install the optional ``vagrant-cachier`` plugin for caching packages that are downloaded while
setting up the development environment::

    vagrant plugin install vagrant-cachier

The ``vagrant-libvirt`` plugin is required when using KVM on Linux::

    vagrant plugin install vagrant-libvirt


Starting the Virtual Machine
----------------------------

Navigate to the ``vagrant`` subdirectory of your local Mercurial clone and run this command to
start your VM::

    vagrant up

or, in case you are using KVM/libvirt, you need to specify the libvirt provider::

    vagrant up --provider libvirt

This command will perform all steps to provide a running VM for developing |oA|. After the
completion of ``vagrant up``, ssh into the VM::

   vagrant ssh

In your VM, start |oA| by running these commands. Notice, your local repository is available in the
virtual machine at ``~/openattic``::

    . env/bin/activate
    python openattic/backend/manage.py runserver 0.0.0.0:8000

Then, start your browser an open the URL as shown in the last lines of the log output of
``vagrant up``.

SUSE vs Debian
--------------

Per default, the VM is based on OpenSUSE, but developing |oA| based on a ``debian/jessie64``
`Vagrant box <https://www.vagrantup.com/docs/boxes.html>`_ is also supported. To run a Debian VM,
run::

    DISTRO=debian vagrant up

or using KVM/libvirt::

    DISTRO=debian vagrant up --provider libvirt

Debugging |oA| with PyCharm Professional
----------------------------------------

With a running Vagrant VM, you can now debug the |oA| Python backend using PyCharm.

First, configure a
`Vagrant Remote Interpreter <https://www.jetbrains.com/help/pycharm/2016.2/configuring-remote-interpreters-via-vagrant.html>`_
pointing to ``/home/vagrant/env/bin/python`` on your VM. Then, add
``/home/vagrant/openattic/backend`` to the Python interpreter paths. You will be asked to activate
a few PyCharm extensions, like a Django support or the remote interpreter tools.

Finally, add the |oA| django Server as a Pycharm `Django server` in the `Run Configurations` using
your configured remote interpreter.

Debugging |oA| with PyCharm Community
-------------------------------------

Please follow the instructions from the `official documentation <https://www.jetbrains.com/help/pycharm/2016.2/remote-debugging.html#6>`_


Troubleshooting
---------------

**|oA| `systemd`**

If the |oA| `systemd` is not running on your VM, you can start it by executing::

    sudo env/bin/python openattic/backend/manage.py runsystemd

in your VM.

**`vagrant destroy` failes**

To fix this error::

    /home/<user>/.vagrant.d/gems/gems/fog-libvirt-0.0.3/lib/fog/libvirt/requests/compute/volume_action.rb:6:in `delete': Call to virStorageVolDelete failed: Cannot delete '/var/lib/libvirt/images/vagrant_default.img': Insufficient permissions (Libvirt::Error)

Run this command or change the owner of ``/var/lib/libvirt/images``::

    chmod 777 /var/lib/libvirt/images

