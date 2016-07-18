|oA| Web UI Tests - E2E Test Suite
==================================

This section describes how our test environment is set up, as well as how you
can run our existing tests on your |oA| system and how to write your own
tests.

By continuously writing E2E-tests, we want to make sure that our graphical
user interface is stable and acts the way it is supposed to be - that offered
functionalities really do what we expect them to do.

We want to deliver a well-tested application, so that you - as users and
community members - do not get bothered with a buggy user interface. Instead,
you should be able to get started with the real deal - MANAGING storage with
|oA|.

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

* ``npm install -g protractor`` (version 3.1.1)

.. note::
  Protractor version 3.x.x requires Node.js |reg| version 4.x (you can check
  your installed version with ``node -v``).

* ``apt-get install openjdk-7-jre-headless``

* ``npm install -g jasmine-beforeAll`` (in case this package is not available,
  try ``npm install -g jasmine-before-all``)

* Choose/Install your preferred browser (Protractor supports the two
  latest major versions of Chrome, Firefox, Safari, and IE)

* Please adapt the ``protractor.conf.js`` file which can be found in
  ``/openattic/webui/`` to your system setup - see instructions below

Protractor Configuration
------------------------

Before starting the tests, you need to configure and adapt some files.

Here's what you have to do in ``protractor.conf.js``:

Enable ``BeforeAll`` / ``AfterAll``
-----------------------------------

In order to use ``beforeAll`` and ``afterAll`` you need to tell protractor to use
``jasmine2`` as framework (protractor uses an older version by default, which
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

Maximize Browser Window
-----------------------

If the browser window in which the tests will be executed is too small, it
occurs that protractor can't click an element and tests will fail. To prevent
this, you can maximize your browser window by default by adding the following
line to ``webui/protractor.conf.js``::

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

Use Multiple Browsers
---------------------

When using Chrome and Firefox for the tests, you could append the following to
your ``protractor.conf.js`` so the test will run in both browsers::

    exports.config.multiCapabilities = [
        {'browserName': 'chrome'},
        {'browserName': 'firefox'}
    ];

To prevent running both browsers at the same time you can add::

    exports.config.maxSessions = 1;

Set up ``configs.js``
---------------------

Create a ``configs.js`` file in folder ``e2e`` and add the URL to you |oA|
system as well as login data - see below::

  (function() {
    module.exports = {
      url     : 'http://IP-to-your-oA-test-sys/openattic/#/login',
      //leave this if you want to use openATTIC's default user for login
      username: 'openattic',
      password: 'openattic',
    };
  }());

In order to run our graphical user interface tests, please make sure that your
|oA| system at least has:

- One LVM volume group
- One ZFS zpool

and add them to ``e2e/configs.js``.

.. note::
  For more information have a look at ``e2e/example_config.js``.

It is important that the first element in this config file is your volume
group.

If you do not have a ZFS zpool configured and you do not want to create one,
you can of course skip those tests by removing the suite from
``protractor.conf.js`` or putting them in to the comment section.

Start webdriver manager Environment
-----------------------------------

Use a separate tab/window to run the following command::

  $ webdriver-manager start

Make Protractor Execute the Tests
---------------------------------

Go to ``/srv/openattic/webui/`` and type ``protractor protractor.conf.js`` in
order to run the tests::

  $ protractor protractor.conf.js (--suite <suiteName>)

.. important::
  Without a given suite protractor will execute all tests (and this will
  probably take a while!)

Starting Only a Specific Test Suite
-----------------------------------

If you only want to test a specific action, you can run i.e.
``protractor protractor.conf.js --suite snapshot_add``.

Available test cases can be looked up in ``protractor.conf.js``, i.e.::

  suites: {
    //suite name       : '/path/to/e2e-test/file.e2e.js'
    snapshot_add       : '../e2e/snapshots/add/**/*.e2e.js',
  }

.. note::
  When running protractor.conf and the browser window directly closes and you
  can see something like "user-data error" (i.e. when using Chrome) in your
  console just create a dir (i.e. in your home directory) and run
  ``google-chrome --user-data-dir=/path/to/created/dir``

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
  +-- ceph
  +-- dashboard
  |   `-- dashboard
  +-- disks
  +-- general
  +-- hosts
  +-- pools
  +-- pagination
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
Actions like ``add``, ``clone`` etc. are always in a separate file. This
makes it better to get an overview and prevents the files from getting very
huge and confusing.

Writing Your Own Tests
----------------------

Please include ``common.js`` in every ``.e2e.js`` file by adding ``var helpers
= require('../common.js');``. In some cases (depending on how you've
structured your tests) you may need to adapt the path.

By including it as ``var helpers`` you can now make use of helper functions
from ``common.js``, i.e. the ``create_volume`` function, you just have to add
``helpers.`` to the function: ``helpers.create_volume( name , type [, size ] )``.

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
is based on a volume (i.e. creating a share), you can use the following lines
to create a new volume::

  beforeAll(function(){
    helpers.login();

    //create an xfs volume before executing any test
    helpers.create_volume("volumename_here","xfs");

  });

You can also specify the size as a string as third argument, otherwise the
volume will always be initiated with 100MB by default.

Depending on which volume type you need, you can set the parameter to:

* ``xfs``
* ``btrfs``
* ``zfs`` (if ``openattic-module-zfs`` is installed)
* ``lun``

Every helper function which is based on a volume needs to get the volume object passed.::

  //var volumename = 'demo_volume';
  //volume: var volume = element(by.cssContainingText('tr', volumename));

  * ``create_snap_clone(volume)``
  * ``helpers.delete_volume(volume, volumename);``
  * ``helpers.create_snapshot(volume);``
  * ``helpers.delete_snapshot(volume);``

When using more than one helper function in one file, please make sure that
you use the right order of creating and deleting functions in ``beforeAll``
and ``afterAll``.

Example:

If you put ``helpers.delete_volume();`` before ``helpers.delete_snapshot();``
the snapshot will be deleted with the volume and the second one
(``delete_snapshot();``) will search for an element which does not longer
exist. A second option is to only use ``helpes.delete_volume();`` so
everything which relates to this volumes (like snapshots, shares) will be
deleted with the deletion of the volume automatically.

If you need to navigate to a specific menu entry (every time!) where your tests
should take place, you can make use of::

  beforeEach(function(){

    //always navigates to menu entry "Volumes" before executing the actions defined in 'it('', function(){});'
    element.all(by.css('ul .tc_menuitem')).get(3);

  });

Style Guide - General e2e.js File Structure / Architecture
----------------------------------------------------------

  * ``describe`` should contain a general description of what is going to be tested (functionality) in this spec file
    i.e. the site, menu entry (and its content), panel, wizard etc.
    example: "should test the user panel and its functionalities"
  * ``it`` - should describe, what exactly is going to be tested in this specific it-case
    i.e. (based on the described example above): "should test validation of form field "Name""
  * Elements which are going to be used more than once should be defined in a variable
    on top of the file (under described)
  * Put required files at the top of the file
  * Do not make tests complex by using a lot of for loops, if statements or even nested functions
  * If something has to be done frequently one can define those steps in a function defined
    in above mentioned ``common.js`` and use this function in specific spec files
    i.e. if you always/often need a user before you can start the actual testing you can define a function ``create_user``
    which contains the steps of creating a user and use the ``create_user``-function in the tests where it's required.
    Therefore you just have to require the ``common.js`` file in the spec file and call the ``create_user``-function in
    the beforeAll function. This procedure is a good way to prevent duplicated code.
    (for examples see common.js -> ``create_volume-``/ ``delete_volume``-function)
  * Make use of the beforeAll/afterAll-functions if possible (see the ``Install Protractor`` instructions).
    Those functions allow you to do some steps (which are only required once) before anything else in the spec file
    is going to be executed.
    For example, if you need to login first before testing anything, you can put this step in a ``beforeAll``-function.
    Also, using a beforeAll instead of a beforeEach saves a lot of time when executing tests. Furthermore, it's not
    always necessary to repeat a specific step beforeEach ``ìt``-section.
    The ``afterAll``-function is a good way to "clean up" things which are no longer needed after the test.
    If you already have a function (i.e. ``create_user``) which creates something, you probably want to delete it after
    the tests have been executed. So it makes sense having another function, which deletes the object
    (in this case a ``delete_user``-function) that can simply be called in ``afterAll``.
    In addition we decided to put an ``afterAll`` at the end of each test file which contains a
    ``console.log("<protractor suite name> -> <filename>.e2e.js")``. By doing so it is possible to track which test in
    which file is currently executed when running all tests.
  * If possible use protractor locators like ``by.model`` or ``by.binding`` (those are performant locators).
    Example::

       <ul class="example">
          <li>{{volume.name}}</li>
       </ul>

    -> Avoid doing: ``var elementName = element.all(by.css('.example li')).get(0);``
    -> Recommended: ``var elementName = element(by.binding('volume.name'));``
  * If ``by.model`` or ``by.binding`` is not available, try using locators like ``by.id`` or ``by.css`` (those are
    also performant locators)
  * Avoid using text locators like ``by.linkText``, ``by.buttonText`` or ``by.cssContainingText`` at least for
    text which tend to change over time / often (like buttons, links and labels)
  * Try to avoid using ``xpath`` - it is a very slow locator. Xpath expressions are hard to read and to debug
  * In a bunch of openATTIC HTML files (see ``openattic/webui/app/templates``)
    you'll find css classes which are especially set for tests (those test
    classes are recognizable by the ``tc_``-term which stands for "test
    class"). This is very useful when protractor finds more than one element
    of something (i.e. "Add"-button) and you can specify the element by adding
    or just using this tc_class of the element you're looking for to the
    locator. This makes the needed element unique (i.e.:
    ``element(by.css('oadatatable .tc_add_btn')).click();``)
  * Tests should be readable and understandable for someone who is not familiar in detail with tests in order to make
    it easy to see what exactly the test does and to make it simple writing tests for contributors.
    Also, for someone who does not know what the software is capable of, having a look at the tests should help
    understanding the behavior of the application
  * Make test spec files independent from each other because it's not guaranteed that test files will be executed in a
    specific order
  * Always navigate to the page which should be tested before each test to make sure that the page is in a "clean state".
    This can be done by putting the navigation part in a ``beforeEach``-function - which ensures that ``it``-sections
    do not depend on each other as well.
  * Locators and specs should apply to the Jasmine2 and Protractor version 3.x.x functionalities
  * Make sure that written tests do work in Chrome (v. 49.x.x) and Firefox (v. 45.x)
  * The name of folders/files should tell what the test is about (i.e. folder "user" contains "user_add.e2e.js")
  * "Workflow"-files contain tests which do not place value on functionalities itself (i.e. add, delete, edit something)
    but check validation and user feedback in forms or dialogs (like error messages)

Tips on how to write tests that also support Firefox
----------------------------------------------------

Let protractor only click on clickable elements, like ``a``, ``button`` or ``input``.

If you want to select an option element use the following command to make sure that
the item is selected (`issue #480 <https://github.com/angular/protractor/issues/480#issuecomment-122429984>`_)::

	browser.actions().sendKeys( protractor.Key.ENTER ).perform();


Debugging your tests
--------------------

To set a breakpoint use ``browser.pause()`` in your code.

After your test pauses, go to the terminal window where you started the test.

You can type ``c`` and hit enter to continue to the next command
or you can type ``rep`` to enter the interactive mode, here you can type
commands that will be executed in the test browser.

To continue the test execution press ``ctrl + c``.
