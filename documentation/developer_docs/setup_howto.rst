.. _developer_setup_howto:

Setting up a Development System
===============================

In order to begin coding on |oA|, you need to set up a development system, by
performing the following steps. The instructions below assume a Debian/Ubuntu
Linux environment.

.. note::
  The |oA| source code is managed using the Mercurial revision control system.
  Mercurial offers you a full-fledged source control, where you can commit and
  manage your source code. Please refer to `Hg Init: a Mercurial tutorial
  <http://hginit.com/>`_ if you are not yet familiar with this tool.

#.  |oA| requires a bunch of tools and software to be installed and
    configured, which is handled automatically by the Debian packages. While
    you could of course configure these things manually, doing so would
    involve a lot of manual work which isn't really necessary. Set up the
    system just as described in :ref:`install_guides_index`, but **do not yet
    execute ``oaconfig install``**. We recommend installing a nightly build
    for development systems.

#.  Set the installed packages on ``hold`` to prevent Apt from updating them::

      # apt-mark hold 'openattic-.*'

#.  Install Mercurial::

      # apt-get install mercurial

#.  Go to the ``/srv`` directory, and clone the |oA| repository there::

      # cd /srv
      # hg clone https://bitbucket.org/openattic/openattic

#.  In file ``/etc/default/openattic``, change the ``OADIR`` variable to point
    to the clone::

      OADIR="/srv/openattic"

#.  In file ``/etc/apache2/conf.d/openattic``, change the ``WSGIScriptAlias``
    line to point to the clone::

      WSGIScriptAlias   /openattic   /srv/openattic/openattic.wsgi

#. Run ``oaconfig install``.

You can now start coding in ``/srv/openattic``. The |oA| daemons, GUI and the
``oaconfig`` tool will automatically adapt to the new directory and use the
code located therein.
