|oA| E2E Tests
==============

This section describes how our test environment is set up, as well as how you
can run our existing tests on your |oA| system and how to write your own
tests.

By continuously writing E2E-tests, we want to make sure that our graphical
user interface is stable and acts the way it is supposed to be - that offered
functionalities really do what we expect them to do. We want to deliver a
well-tested application, so that you - as users and community members - do not
get bothered with a buggy user interface. Instead, you should be able to get
started with the real deal - MANAGING storage with |oA|.

About Protractor
----------------

Protractor is a end-to-end test framework, which is especially made for
AngularJS applications and is based on
`WebDriverJS <http://docs.seleniumhq.org/projects/webdriver/>`_.
Protractor will run tests against the application in a real browser and
interacts with it in the same way a user would.

For more information, please refer to the
`protractor documentation <https://angular.github.io/protractor/#/>`_.

System Requirements
-------------------

Testing VM:

* Based on our experience,the system on which you want to run the tests needs
  at least 4GB RAM to prevent it from being laggy or very slow!

Install Protractor
------------------

* ``npm install -g protractor``

* ``apt-get install open-jdk-7-headless``

* ``npm install -g jasmine-beforeAll`` (in case this package is not available,
  try ``npm install -g jasmine-before-all``)

* Choose/Install your preferred browser (Protractor supports the two
  latest major versions of Chrome, Firefox, Safari, and IE)

* Please adapt the ``protractor.conf.js`` file which can be found in
  ``/openattic/webui/`` to your system setup - see instructions below

Protractor Configuration
------------------------

Before starting the tests, you need to configure and adapt some files Here's
what you have to do in ``protractor.conf.js``:

Enable BeforeAll / AfterAll
---------------------------

In order to use 'beforeAll' and 'afterAll' you need to tell protractor to use
'jasmine2' as framework (protractor uses an older version by default, which
does not support beforeAll/afterAll).

Add the following line to your protractor.conf::

  exports.config = {

    seleniumAddress: ...

    jasmineNodeOpts: {
     ....
    },

  ``framework: 'jasmine2',``

    suites: {
      ...
      ...

    },
    ....
  }


Tell protractor where to connect
--------------------------------

..by adding the url to your |oA| system as well as login data::

  (function() {
    module.exports = {
      url     : 'http://IP-to-your-oA-test-sys/openattic/#/login',
      //leave this if you want to use openATTIC's default user for login
      username: 'openattic',
      password: 'openattic',
    };
  }());


Maximize Browser Window
-----------------------

If the browser windows in which the tests will be executed is too small, it
occours that protractor can't click an element and tests will fail. To prevent
this, you can maximize your browser window by default by adding the following
line to ``protractor.conf.js``::

  exports.config = {

    seleniumAddress: ...
    jasmineNodeOpts: {
      ....
    },

    framework: 'jasmine2',

    suites: {
      ...
      ...
      ..

    },

  ``onPrepare: function(){``
    ``browser.driver.manage().window().maximize();``
  ``},``
  }

Set up configs.js
-----------------

In order to run our graphical user interface tests, please make sure that your
|oA| system at least has:

- one volume group
- one zpool

and add them to ``configs.js`` (see examples). It is important that the first
element in this config file is your volume group.

If you do not have a zpool configured and you do not want to create one, you
can of course skip those tests by removing the suite from
``protractor.conf.js`` or putting them in to the comment section.

Start Protractor
----------------

use a separate tab/window to run the following command:

``webdriver-manager start``

Make Protractor Execute the Tests
---------------------------------

Go to ``/srv/openattic/webui/`` and type ``protractor protractor.conf.js`` in
order to run the tests::

  $ protractor protractor.conf.js (--suite <suiteName>)

.. important::
  Without a given suite protractor will execute all tests (and this will
  probably take a while!)

Start Only a Specific Test Suite
--------------------------------

If you only want to test a specific action, you can run i.e.
``protractor protractor.conf.js --suite snapshot_add``
Available test cases can be looked up in protractor.conf.js,
i.e.::

  suites: {
    //suite name       : '/path/to/e2e-test/file.e2e.js'
    snapshot_add       : '../e2e/snapshots/add/**/*.e2e.js',
  }

.. note::
  When running protractor.conf and the browser window directly closes and you
  can see something like "user-data error" (i.e. when using chrome) in your
  console just create a dir (i.e. in /home/) and do ``chromium
  --user-data-dir=/path/to/created/dir``

How to Cancel the Tests
-----------------------

When running the tests and you want to cancel them, rather press :kbd:`CTRL+C`
on the commandline (in same window in which you've started
``protractor.conf.js``) than closing the browser. Just closing the browser
window causes every single test to fail because protractor now tries to
execute the tests and can not find the browser window anymore.

E2E-Test Directory and File Structure
-------------------------------------

In directory ``/srv/openattic/e2e/`` the following directories can be found::

  +-- auth
  +-- commandLogs
  +-- dashboard
  |   `-- todoWidget
  +-- disks
  +-- general
  +-- hosts
  |   `-- peer
  +-- pools
  +-- shares
  |   +-- cifs
  |   +-- http
  |   +-- lun
  |   `-- nfs
  +-- snapshots
  |   +-- add
  |   `-- clone
  +-- users
  +-- volumes
  |   +-- add
  |   +-- protection
  |   +-- resize
  |   `-- zvol
  `-- wizards
      +-- block
      +-- file
      `-- vm

Most of the directories contain a ``.._workflow.e2e.js`` in which we only test
things like validation, the number of input fields, the title of the form etc.
Actions like ``add``, ``clone`` etc. are always in a spearate file. This
makes it better to get an overview and prevents the files from getting very
huge and confusing.

Writing Your Own Tests
----------------------

Please include ``common.js`` in every ``.e2e.js`` file by adding ``var helpers
= require('../common.js');``. In some cases (depending on how you've
structured your tests) you may need to adapt the path.

By including it as ``var helpers`` you can now make use of helper functions
from ``common.js``, i.e. the ``create_volume`` function, you just have to add
``helpers.`` to the function: ``helpers.create_volume("volume_type_here")``.

The following helper functions are implemented:

* ``create_volume``
* ``delete_volume``
* ``create_snapshot``
* ``delete_snapshot``
* ``create_snap_clone``
* ``delete_snap_clone``
* ``create_host``
* ``delete_host``

So if you want to write a test and you need a volume to test an action which
is based on a volume (i.e. creating a share) you can use the following lines::

  beforeAll(function(){
    helpers.login();

    //create an xfs volume before executing any test
    helpers.create_volume("xfs");

  });

Depending on which volume type you need, you can set the parameter to:

  * ``xfs``
  * ``btrfs``
  * ``zfs`` (if ``openattic-module-zfs`` is installed)
  * ``lun``

All other helper functions can be used like this:

``helpers.delete_volume();``
``helpers.create_snapshot();`` ..and so on.

When using more than one helper function in one file, please make sure that
you use the right order of createing and deleting functions in ``beforeAll``
and ``afterAll``.

Example:

if you put ``helpers.delete_volume();`` before ``helpers.delete_snapshot();``
the snapshot will be deleted with the volume and the second one
(``delete_snapshot();``) will search for an element which does not longer
exist. A second option is to only use ``helpes.delete_volume();`` so
everything which relates to this volumes (like snapshots, shares) will be
deleted with the deletion of the volume automatically.

If you need to navigate to a specific menu entry (everytime!) where your tests
should take place, you can make use of::

  beforeEach(function(){

    //always navigates to menu entry "Volumes" before executing the actions defined in 'it('', function(){});'
    element.all(by.css('ul .tc_menuitem')).get(3);

  });
