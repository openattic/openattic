|oA| REST API Tests - Gatling Test Suite
========================================

Gatling is the |oA| integration test suite. It's based on the
`Python unit testing framework <https://docs.python.org/2/library/unittest.html>`_
and contains a bunch of tests to be run against a live |oA| installation.

Gatling sends requests to |oa|'s REST API and checks if the responses are
correct. For example Gatling tries to create a volume via |oA|'s REST API and
checks if it's getable and deletable afterwards. If an error should be included
in a response, Gatling checks if it is really included.

Afterwards Gatling checks the |oA| internal command log if errors occurred
during execution time.


Quick start
-----------

To run Gatling, you need to have an |oA| host set up that has all the
features installed (have a look at :ref:`install_guides_index`) which you
intend to test. Then create a configuration file in the *conf* subdirectory
(i.e., *conf/<yourhost>.conf*) as explained in section
:ref:`developer_dev_gatling_configuration` and run Gatling with the following
command::

    python gatling.py -t yourhost

Gatling will adapt to your environment, automatically skipping tests that
cannot be run on your installation, and run all tests that can run in your
environment.


Dependencies
------------

Gatling depends on the ``testtools`` and ``xmlrunner`` packages. To install
them, type::

    apt-get install python-testtools python-xmlrunner


.. _developer_dev_gatling_configuration:

Configuration
-------------

In order to get Gatling work well with your |oA| environment it needs some
information about the system configuration. These information are organized in
configuration files. For an example configuration, have a look at the
*gatling.conf* file included in the distribution. These settings are suitable
in most of the cases. However all the settings which do not match your |oA|
installation need to be overridden in a separate configuration file.

The first section of the configuration file is the ``options`` section. It
holds general settings about how to connect to your |oA| host. Enter the
complete name of your |oA| host at the ``host_name`` setting. If the username
or the password of the admin account does not match the default values you will
need to configure them too.

If you don't want to test a specific feature - for example you don't have the
|oA| DRBD module installed, so you don't want to test it by Gatling, you just
need to disable the related tests by::

    [drbd]
    enabled = no

For a complete overview of the configuration section and options please have a
look at the *gatling.conf* file.
All available tests of Gatling are enabled by default.

CI integration
--------------

Gatling supports integration in Continuous Integration systems like Jenkins.
To use this functionality, pass the ``--xml`` option to Gatling, which will
instruct Gatling to write JUnit-compatible test reports in XML format into
an output directory of your choice. You can then instruct your build server
to generate reports from these documents.


Advanced options
----------------

Gatling uses the following command line structure::

    python gatling.py [options] -- [unittest.TestProgram options]

Gatling supports all the options that the standard Python *unittest* module
supports when run using ``python -m unittest``. However, in order to separate
Gatling's own options from those passed on to ``unittest``, you need to add
``--`` in front of *unittest* options, like such::

    python gatling.py --xml -- --failfast

If the Gatling command line does not include ``--``, Gatling will by default
activate test discovery and verbosity. If you want to run Gatling without
*any* *unittest* arguments, pass ``--`` at the end of the command line.


Source code layout
------------------

Test cases are laid out in a way that ensures maximum flexibility while
keeping the amount of duplicate code to an absolute minimum.

The |oA| API is flexible enough to allow lots of different combinations
of storage technologies, and testing all those different combinations is
somewhat of a challenge. To mediate this without having to duplicate test
cases, Gatling uses a system of combining test scenarios and tests to test
cases that are then added to the test suite and run by Gatling.


Scenarios
"""""""""

A scenario defines the environment in which tests are supposed to be run,
for instance:

* Test sharing an XFS-formatted LV using NFS.
* Test sharing a ZFS subvolume using NFS.
* Test sharing an Ext4-formatted ZVol using NFS.
* Test sharing an unformatted ZVol using iSCSI.

Scenario classes use the ``setUpClass`` and ``tearDownClass`` classmethods
to prepare the |oA| system for the tests that are to be run, creating
any necessary Volume pools or other objects to be used by the tests, and
provide a ``_get_pool`` method that returns the Volume pool on which the
tests are to be run.

When implementing a Scenario, make sure that its ``setUpClass`` method

* raises ``SkipTest`` if the test scenario cannot be run on this system
  due to missing |oA| modules or other errors,
* properly calls its superclass so that inheriting multiple scenarios
  works the way it should, like so::

      class LvTestScenario(GatlingTestCase):
          @classmethod
          def setUpClass(cls):
              super(LvTestScenario, cls).setUpClass()

Generally lay out your class in a way that it can be combined with as many
other scenarios as possible.


Tests
"""""

Tests are collected in classes that inherit from ``object`` and only define
``test_<something>`` methods. These classes **must not** inherit
``unittest.TestCase`` so they can be imported into other modules without
causing the tests to be discovered and run twice.

Although this class does not inherit ``unittest.TestCase`` directly, their
code can make use of everything the ``TestCase`` class provides. This is
because the ``*Tests`` classes are abstract classes meant to be combined
with a test scenario in order to be run, which then makes it a full
``TestCase`` subclass.


TestCases
"""""""""

In order to create a TestCase subclass that can be discovered and run,
create a third class that inherits both the Scenario and the Tests, like so::

    class LioTestCase(LvTestScenario, LunTestScenario, LvLioTests):
        pass

Be sure to inherit all the test scenarios you need for your test functions
to run, so that the environment is set up and torn down correctly and tests
can be skipped if necessary modules are missing.
