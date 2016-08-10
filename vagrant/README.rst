Installation
------------

As I've developed the VM using KVM, install KVM now::

    sudo apt-get install qemu-kvm

Then, install Vagrant::

    sudo apt-get install vagrant

Installed required Vagrant plugins::

    vagrant plugin install vagrant-libvirt
    vagrant plugin install vagrant-cachier

``vagrant-cachier`` is optional, but recommended in order to cache packages for future VMs.

Start VM
--------

In this directory, run this command to start your VM::

    vagrant up --provider libvirt

Then, ssh into the VM::

   vagrant ssh

And start openATTIC::

    . env/bin/activate
    python openattic/backend/manage.py runserver 0.0.0.0:8000

Then, start your browser an open the URL as shown in the log output of ``vagrant up``.

SUSE vs Debian
--------------

Per default, the VM is based on OpenSUSE, but running openATTIC based on ``debian/jessie64`` is
also a supported Vagrant box.



