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
also a supported Vagrant box. To run a Debian VM, run::

    DISTRO=debian vagrant up --provider libvirt

Debugging openATTIC with PyCharm
--------------------------------

Now, with a working Vagrant VM, we can now use PyCharm to debug the openATTIC backend.

First, configure ``/home/vagrant/env/bin/python`` as a `Vagrant Remote Interpreter <https://www.jetbrains.com/help/pycharm/2016.2/configuring-remote-interpreters-via-vagrant.html>`_.
Then, add ``/home/vagrant/openattic/backend`` to the interpreter paths. I was asked to activate
a few PyCharm extensions, like a Django support. Usually, you can activate them.

Then, add the openATTIC django Server as a `Django server` in the `Run Configurations` using your
configured remote interpreter.


Troubleshooting
---------------

To start the openATTIC-systemD, run::

    sudo env/bin/python openattic/backend/manage.py runsystemd

in your VM.


To fix::

    dbus.exceptions.DBusException: org.freedesktop.DBus.Error.AccessDenied: Connection ":1.6" is not allowed to own the service "org.openattic.systemd" due to security policies in the configuration file

restart your dbus service::

    sudo service dbus restart

To fix::

    /home//.vagrant.d/gems/gems/fog-libvirt-0.0.3/lib/fog/libvirt/requests/compute/volume_action.rb:6:in `delete': Call to virStorageVolDelete failed: Kann Verknüpfung mit Datei '/var/lib/libvirt/images/vagrant_default.img' nicht revidieren: Keine Berechtigung (Libvirt::Error)

Run::

    chmod 777 /var/lib/libvirt/images
