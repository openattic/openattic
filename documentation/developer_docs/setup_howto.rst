.. _developer_setup_howto:

Setting up a Development System
===============================

In order to begin coding on |oA|, you need to set up a development system, by
performing the following steps. The instructions below assume a Debian
"Jessie" or Ubuntu "Trusty" Linux environment. The package names and path
names likely differ on other Linux distributions.

If you don't want to bother with performing the following steps manually,
take a look at :ref:`developer_vagrant_howto`, which automates the process
of setting up a development environment in a virtual machine to keep it
separated from your local system.

Installing the Development Tools
--------------------------------

|oA| requires a bunch of tools and software to be installed and configured,
which is handled automatically by the Debian packages. While you could of
course configure these things manually, doing so would involve a lot of manual
work which isn't really necessary. Set up the system just as described in
:ref:`install_guides_index`, but **do not yet execute** ``oaconfig install``.

We recommend installing a nightly build for development systems, which is
based on the latest commit in the ``default`` branch.

#.  Set the installed packages on ``hold`` to prevent Apt from updating them::

      # apt-mark hold 'openattic-.*'

#.  Install Git::

      # apt-get install git

#.  Install Node.JS and the Node Package Manager ``npm``::

      # apt-get install nodejs npm
      # ln -s /usr/bin/nodejs /usr/bin/node

#.  Go to the ``/srv`` directory, and create a local clone of your |oA| fork
    there, using the current ``master`` branch as the basis::

      # cd /srv
      # git clone https://bitbucket.org/<Your user name>/openattic.git
      # git checkout master

#.  Customize the Apache configuration by editing
    ``/etc/apache2/conf-available/openattic.conf``:

    * Replace the path ``/usr/share/openattic`` with ``/srv/openattic/backend``

    * Add the following directive::

        <Directory /srv/openattic>
            Require all granted
        </Directory>

    * Adapt the ``WSGIScriptAlias`` paths to your local clone::

        WSGIScriptAlias /openattic/serverstats /srv/openattic/backend/serverstats.wsgi
        WSGIScriptAlias /openattic             /srv/openattic/backend/openattic.wsgi

#.  In file ``/etc/default/openattic``, change the ``OADIR`` variable to point
    to the local git clone::

      OADIR="/srv/openattic/backend"

#.  Now build the Web UI::

      # cd /srv/openattic/webui
      # npm run build

    If you intend to make changes to the web interface, it may be useful to
    run ``grunt dev`` as a background task, which watches the project
    directory for any changed files and triggers an automatic rebuild of the
    web interface code (including the ``jshint`` output), if required.
    Grunt will not include the ``eslint`` output, because the provided
    configuration is there to help **you** develop the UI.

    In some rare cases there might be a problem with "just" updating the frontend
    dependencies and rebuilding the frontend files. In this case, it helps to delete
    all dependecies. The ``npm run rebuild`` command does that and then executes
    the ``npm run build`` process.

#.  Run ``oaconfig install`` and start |oA| by running ``oaconfig start``.

The |oA| web interface should now be accessible from a local web browser via
<http://localhost/openattic/>_ . The default username and password is
"openattic".

You can now start coding by making modifications to the files in
``/srv/openattic``. The |oA| daemons, GUI and the ``oaconfig`` tool will
automatically adapt to the new directory and use the code located therein.

See chapters :ref:`developer_contribute` and
:ref:`developer_contributing_guidelines` for further details on how to prepare
your code contributions for upstream inclusion.

How to use eslint in your developer environment
-----------------------------------------------

Our ``eslint`` configuration gives you useful hints and tips how to provide
``angularJS`` code that is highly maintainable and forward-thinking.
To see the hints and tips you have to install ``eslint`` and the plugin
for ``angularJS`` globally::

  # npm install -g eslint eslint-config-angular eslint-plugin-angular

To `simply use it <http://eslint.org/docs/user-guide/command-line-interface>`_
from the command line you can do the following::

  % cd <clone>/webui
  % eslint <path>

Or with `vim <http://www.vim.org/>`_ without `Syntastic
<https://github.com/vim-syntastic/syntastic>`_::

  :!eslint %

For all IDEs ``eslint`` can be installed as a plugin, if not already enabled.

How to get the authentication token for your own user
-----------------------------------------------------

If you like to use the |oa| TokenAuthentication (:ref:`admin_auth_methods`)
in your own scripts in order to achieve automatization for example, you need
to find out your own authentication token at first.

Here are two examples how you can get your authentication token via the REST
API:

**Curl:**
::

    curl --data "username=username&password=password"
    http://<openattic-host>/openattic/api/api-token-auth/

**Python requests:**
::

    import requests

    requests.post("http://<openattic-host>/openattic/api/api-token-auth/",
    data={"username": "<username>", "password": "<password>"})

Examples for additional scripts can be found here:

* `Snapshot Python script with authtoken <http://blog.openattic.org/posts/snapshot-python-script-with-authtoken/>`_
* `Cronjob Snapshot Script for openATTIC <http://blog.openattic.org/posts/cron-snapshot-script-for-openattic/>`_
