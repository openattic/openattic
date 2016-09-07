.. _developer_vagrant_howto:

Setting up a Development System with Vagrant
============================================

Setting up a development system using `Vagrant <https://www.vagrantup.com/>`_ is by far the easiest
way to start developing on |oa|. However, we also provide instructions for setting up a classical
development environment in :ref:`developer_setup_howto`.

Vagrant Installation
--------------------

Our Vagrant setup uses either a VirtualBox or a KVM/libvirt VM as base image.
You will need to install at least one of them.

For example, KVM/libvirt can be installed on Ubuntu by running::

    sudo apt-get install qemu-kvm

Please follow the official documentation for
`installing Vagrant <https://www.vagrantup.com/docs/installation/>`_. After installing Vagrant,
install the optional ``vagrant-cachier`` plugin for caching packages that are downloaded while
setting up the development environment::

    vagrant plugin install vagrant-cachier

The ``vagrant-libvirt`` plugin is required when using KVM on Linux::

    vagrant plugin install vagrant-libvirt

.. note::

	If you experience an error while trying to install ``vagrant-libvirt``, you might need to
	install the ``libvirt-dev`` package.


Starting the Virtual Machine
----------------------------

The |oA| source code repository contains a Vagrant configuration file that
performs the necessary steps to get you started. Follow the instructions
outlined in :ref:`developer_hg_howto` on how to create your own fork and
local Mercurial repository.

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

Finally, add the |oA| Django Server as a Pycharm `Django server` in the `Run Configurations` using
your configured remote interpreter.

Debugging |oA| with PyCharm Community
-------------------------------------

Please follow the instructions from the `official documentation <https://www.jetbrains.com/help/pycharm/2016.2/remote-debugging.html#6>`_


Troubleshooting
---------------

**openATTIC systemd**

If the |oA| `systemd` is not running on your VM, you can start it by executing::

    sudo env/bin/python openattic/backend/manage.py runsystemd

in your VM.

**`vagrant destroy` fails due to a permission problem**

To fix this error::

    /home/<user>/.vagrant.d/gems/gems/fog-libvirt-0.0.3/lib/fog/libvirt/requests/compute/volume_action.rb:6:in `delete': Call to virStorageVolDelete failed: Cannot delete '/var/lib/libvirt/images/vagrant_default.img': Insufficient permissions (Libvirt::Error)

Run this command or change the owner of ``/var/lib/libvirt/images``::

    chmod 777 /var/lib/libvirt/images

**`vagrant destroy` fails due to wrong provider**

You may also encounter the error that Vagrant tells you to `vagrant destroy`, but it doesn't seem to work. In that case
you may be experiencing `this <https://github.com/vagrant-libvirt/vagrant-libvirt/issues/561>`_ issue.

A workaround for this is to specify your provider as default provider in the Vagrantfile like so:

.. code-block:: ruby

    ENV['VAGRANT_DEFAULT_PROVIDER'] = 'libvirt'

**`vagrant up` fails on "Waiting for domain to get an IP address..."**

It looks like this problem has something to do with the libvirt library and specific mainboards. We
haven't found the cause of this problem, but using a different libvirt driver at least works around
it.

Using ``qemu`` instead of ``kvm`` as driver does the trick. But kvm is and will be enabled by
default, because qemu runs slower than kvm. You have to adapt the driver yourself in the
``Vagrantfile`` like so:

.. code-block:: ruby

    Vagrant.configure(2) do |config|
        config.vm.provider :libvirt do |lv|
            lv.driver = 'qemu'
        end
    end

If you want to know more about this problem or even want to contribute to it, visit our bug tracker
on issue `OP-1455 <https://tracker.openattic.org/browse/OP-1455>`_.
