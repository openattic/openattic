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

.. _installing_the_develpment_tools:

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

#.  Install Node.js and the Node Package Manager ``npm``::

      # apt-get install nodejs npm
      # ln -s /usr/bin/nodejs /usr/bin/node

    .. note::
        We currently support Node.js v6.11.x

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

    .. _build_the_web_ui:

#.  Now build the Web UI::

      # cd /srv/openattic/webui
      # npm run build

    If you intend to make changes to the web interface, it may be useful to
    run ``npm run dev`` as a background task, which watches the project
    directory for any changed files and triggers an automatic rebuild of the
    web interface code (including the ``eslint`` output), if required.

    .. note::
        Webpack will not include the ``eslint`` output for angular, because the
        provided configuration is there to help **you** develop the UI.

    .. note::
        If you modify any npm package or webpack configuration you will have to
        stop the background task and run it again. After doing so, the
        modification will be reflected.

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

How to run the frontend in a local server
-----------------------------------------

If you wish to run a frontend server on your local machine, while keeping the
backend on a different machine, you can do it by simply creating an extra
configuration file and replacing the build command shown in
:ref:`installing_the_develpment_tools` with ``npm start``.

We already provide you with a sample configuration file, that can be found at
''webui/webpack.config.json.sample'', so you just need to copy the contents of
that file to a new one named ''webpack.config.json'' and update the value of the
target property so it reflects the hostname of your backend.

After creating the config file you can run the command and an instance of
webpack dev server will start running on the background.

One big difference of this server is that it will keep all the compiled code in
memory, allowing for a faster development process.
It also comes with a live reload functionallity that will reload your browser
automatically each time it detects a change in your code.
And last, but not least, it will provide you with a proxy to your remote backend
so you will not have CORS problems.

You can access openATTIC at http://localhost:8080/openattic/.

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

.. _webui_local_configuration:

WebUI local configuration
-------------------------

Our frontend application reads most of its default values from a global
configuration file found in ``webui/app/config.js``.

If you ever need to permanently change one of those values you can just open the
file, change it and save the modification. This way everyone will have access
to that same value.

But in situations where the changes you intent to apply only makes sense to your
development environment, e.g. when using our vagrant setup
(:ref:`developer_vagrant_howto`), you will have to take an extra step.
You will have to create a local configuration file that will overwrite all the
values of the preexisting file.
To do that, simply create a new file, ``webui/app/config.local.js``, with the
content of ``webui/app/config.local.js.sample``. Finally you have to
:ref:`rebuild the frontend <build_the_web_ui>`. After that you, and only you, will
see your custom configuration applied.

.. _backend_local_configuration:

Backend local configuration
---------------------------

Same as to the frontend application, the backend part reads most of its default
values from a global configuration file found in ``backend/settings.py``.

If you want to customize those settings equal to the frontend application, then
simply create the file ``backend/settings_local.conf`` and put the key/value pairs
you want to override into this file.::

  SALT_API_HOST='deepsea-1.xyz.net'
  SALT_API_EAUTH='sharedsecret'
  SALT_API_SHARED_SECRET='173a59b3-5abf-4a78-808a-253fe9ae3d94'

  RGW_API_HOST="deepsea-1.xyz.net"
  RGW_API_ADMIN_RESOURCE="admin"
  RGW_API_USER_ID="admin"
  RGW_API_ACCESS_KEY="PK258BAY1G1KEM7UH2Y3"
  RGW_API_SECRET_KEY="rsOV874KLsaUBKLQzJ1oYdzyo7OXV4OAWoGDOdvE"

  GRAFANA_API_HOST="deepsea-1.xyz.net"
  GRAFANA_API_PORT="3000"
  GRAFANA_API_USERNAME="admin"
  GRAFANA_API_PASSWORD="admin"

The local configuration will be applied when you restart the webserver and |oA| systemd
daemon.
