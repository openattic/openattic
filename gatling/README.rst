Gatling -- The openATTIC Integration Test Suite
===============================================

Gatling is a test suite containing a bunch of unit tests to be run against a
live openATTIC installation. It tests openATTIC's behaviour in a series of
different scenarios.


Quick start
-----------

To run Gatling, you need to have an openATTIC host set up that has all the
features installed which you intend to test. Then create a configuration
file in the *conf* subdirectory (i.e., *conf/<yourhost>.conf*) that contains
the API URL needed for this host and run Gatling with the following command::

    python gatling.py -t yourhost

Gatling will adapt to your environment, automatically skipping tests that
cannot be run on your installation, and run all tests that can run in your
environment.


Dependencies
------------

Gatling depends on the ``testtools`` and ``xmlrunner`` packages. To install
them, type::

    apt-get install python-testtools python-xmlrunner


Configuration
-------------

For an example configuration, have a look at the *gatling.conf* file
included in the distribution.


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

The openATTIC API is flexible enough to allow lots of different combinations
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
to prepare the openATTIC system for the tests that are to be run, creating
any necessary Volume pools or other objects to be used by the tests, and
provide a ``_get_pool`` method that returns the Volume pool on which the
tests are to be run.

When implementing a Scenario, make sure that its ``setUpClass`` method

* raises ``SkipTest`` if the test scenario cannot be run on this system
  due to missing openATTIC modules or other errors,
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

