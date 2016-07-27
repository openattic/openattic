.. _developer_setup_howto:

Setting up a Development System
===============================

In order to begin coding on |oA|, you need to set up a development system, by
performing the following steps. The instructions below assume a Debian
"Jessie" or Ubuntu "Trusty" Linux environment. The package names and path
names likely differ on other Linux distributions.

The |oA| source code is managed using the `Mercurial
<https://www.mercurial-scm.org/>`_ distributed source control management tool.
Mercurial offers you a full-fledged version control, where you can commit and
manage your source code locally and also exchange your modifications with
other developers by pushing and pulling change sets across repositories.

If you're new to Mercurial, take a look at the `Learn Mercurial
<https://www.mercurial-scm.org/learn>`_ web site. This will teach you the
basics of how to get started.

Create Your own |oA| Fork
-------------------------

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

#.  Install Mercurial and Git::

      # apt-get install mercurial git

#.  Install Node.JS and the Node Package Manager ``npm``::

      # apt-get install nodejs npm
      # ln -s /usr/bin/nodejs /usr/bin/node

#.  Install Bower and Grunt (to build the Web UI)::

      # npm install -g bower
      # npm install grunt
      # npm install -g grunt-cli

#.  Go to the ``/srv`` directory, and create a local clone of your |oA| fork
    there, using the current ``development`` branch as the basis::

      # cd /srv
      # hg clone -u development https://hg@bitbucket.org/<Your user name>/openattic

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
    to the local Mercurial clone::

      OADIR="/srv/openattic/backend"

#.  Now build the Web UI::

      # cd /srv/openattic/webui
      # npm install
      # bower install --allow-root
      # grunt build

    If you intend to make changes to the web interface, it may be useful to
    run ``grunt dev`` as a background task, which watches the project
    directory for any changed files and triggers an automatic rebuild of the
    web interface code (including the jshint output), if required.

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
