.. _dev_e2e:

|oA| Web UI Tests - E2E Test Suite
==================================

This section describes how our **E2E test** environment is set up, as well as
how you can run our existing **E2E tests** on your |oA| system and how to write
your own tests.
If you are looking for Web UI **Unit tests** documentation please refer to
:ref:`dev_fe_unit_tests`.

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

.. note::
  Protractor and most of its dependencies will be installed locally when you
  execute ``npm install`` on ``webui/``.

* *(optional)* ``npm install -g protractor@5.1.2``

* ``apt-get install openjdk-8-jre-headless oracle-java8-installer``

* Choose/Install your preferred browser (Protractor supports the two
  latest major versions of Chrome, Firefox, Safari, and IE)

* Please adapt the ``protractor.conf.js`` file which can be found in
  ``/openattic/webui/`` to your system setup - see instructions below

Protractor Configuration
------------------------

Before starting the tests, you need to configure and adapt some files.

Use Multiple Browsers
^^^^^^^^^^^^^^^^^^^^^

When using Chrome and Firefox for the tests, you could append the following to
your ``protractor.conf.js`` so the test will run in both browsers::

    exports.config.multiCapabilities = [
        {'browserName': 'chrome'},
        {'browserName': 'firefox'}
    ];

To prevent running both browsers at the same time you can add::

    exports.config.maxSessions = 1;

Set up ``configs.js``
^^^^^^^^^^^^^^^^^^^^^

Create a ``configs.js`` file in folder ``e2e`` and add the URL to you |oA|
system as well as login data - see below::

  (function() {
    module.exports = {
      urls: {
        base: '<proto://addr:port>',
        ui: '/openattic/#/',
        api: '/openattic/api/'
      },
      //leave this if you want to use openATTIC's default user for login
      username: 'openattic',
      password: 'openattic',
    };
  }());

If you are using a Vagrant box, then you have to set urls.ui to ``/#/`` and
urls.api to ``/api/``.

In order to run our graphical user interface tests, please make sure that your
|oA| system at least has:

- One LVM volume group
- One ZFS zpool

and add them to ``e2e/configs.js``.

.. note::
  For more information have a look at ``e2e/configs.js.sample``.

It is important that the first element in this config file is your volume
group.

If you do not have a ZFS zpool configured and you do not want to create one,
you can of course skip those tests by removing the suite from
``protractor.conf.js`` or putting them in to the comment section.

Start webdriver manager Environment
-----------------------------------

Go to ``webui/`` and type the following command:

``$ webdriver-manager start`` *or:* ``$ npm run webdriver``

Make Protractor Execute the Tests
---------------------------------

Use a separate tab/window, go to ``webui/`` and type::

  $ npm run protractor (-- --suite <suiteName>)

.. important::
  Without a given suite protractor will execute all tests (and this will
  probably take a while!)

Starting Only a Specific Test Suite
-----------------------------------

If you only want to test a specific action, you can run i.e.
``$ npm run protractor -- --suite general``.

Available test cases can be looked up in ``protractor.conf.js``, i.e.::

  suites: {
    //suite name       : '/path/to/e2e-test/file.e2e.js'
    general            : '../e2e/base/general/**/general.e2e.js',
  }

.. note::
  When running protractor.conf and the browser window directly closes and you
  can see something like "user-data error" (i.e. when using Chrome) in your
  console just create a dir (i.e. in your home directory) and run
  ``google-chrome --user-data-dir=/path/to/created/dir``

How to Cancel the Tests
-----------------------

When running the tests and you want to cancel them, rather press :kbd:`CTRL+C`
on the commandline (in same window in which you've started ``protractor``) than
closing the browser. Just closing the browser window causes every single test to
fail because protractor now tries to execute the tests and can not find the
browser window anymore.

E2E-Test Directory and File Structure
-------------------------------------

In directory ``e2e/`` the following directories can be found::

  +-- base
  |   '-- auth
  |   '-- datatable
  |   '-- general
  |   '-- pagination
  |   '-- pools
  |   '-- settings
  |   '-- taskqueue
  |   '-- users
  +-- ceph
  |   `-- iscsi
  |   `-- nfs
  |   `-- pools
  |   `-- rbds
  |   `-- rgw

Most of the directories contain a ``*form.e2e.js`` in which we only test
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
from ``common.js``, i.e. the ``setLocation`` function, you just have to add
``helpers.`` to the function:
``helpers.setLocation( location [, dialogIsShown ] )``.

The following helper functions are implemented:

* ``setLocation``
* ``leaveForm``
* ``checkForUnsavedChanges``
* ``get_list_element``
* ``get_list_element_cells``
* ``delete_selection``
* ``search_for``
* ``search_for_element``
* ``login``
* ``hasClass``

When using more than one helper function in one file, please make sure that
you use the right order of creating and deleting functions in ``beforeAll``
and ``afterAll``.

If you need to navigate to a specific menu entry (every time!) where your tests
should take place, you can make use of::

  beforeEach(function(){

    //always navigates to menu entry "ISCSI" before executing the actions
    //defined in 'it('', function(){});'
    element(by.css('.tc_menuitem_ceph_iscsi')).click();

  });

Style Guide - General e2e.js File Structure / Architecture
----------------------------------------------------------

You should follow the official `Protractor style guide
<http://www.protractortest.org/#/style-guide>`_.

Here are a few extra recommendations:

  * ``describe`` should contain a general description of what is going to be
    tested (functionality) in this spec file i.e. the site, menu entry (and its
    content), panel, wizard etc.
    example: "should test the user panel and its functionalities"
  * ``it`` should describe, what exactly is going to be tested in this
    specific it-case i.e. (based on the described example above): "should test
    validation of form field "Name""
  * Elements which are going to be used more than once should be defined in a
    variable on top of the file (under described)
  * If something has to be done frequently and across multiple spec files one
    can define those steps in a function defined in above mentioned
    ``common.js`` and use this function in specific spec files i.e. if you
    always/often need a user before you can start the actual testing you can
    define a function ``create_user`` which contains the steps of creating a
    user and use the ``create_user`` function in the tests where it's required.
    Therefore you just have to require the ``common.js`` file in the spec file
    and call the ``create_user`` function in the `beforeAll` function.
    This procedure is a good way to prevent duplicated code. (for examples see
    ``common.js`` -> ``login`` function)
  * Make use of the ``beforeAll``/``afterAll`` functions if possible.
    Those functions allow you to do some steps (which are only required once)
    before/after anything else in the spec file is going to be executed.
    For example, if you need to login first before testing anything, you can put
    this step in a ``beforeAll`` function.
    Also, using a ``beforeAll`` instead of a ``beforeEach`` saves a lot of time
    when executing tests.
    Furthermore, it's not always necessary to repeat a specific step before each
    ``ìt`` section.
    The ``afterAll`` function is a good way to "clean up" things which are no
    longer needed after the test.
    If you already have a function (i.e. ``create_user``) which creates
    something, you probably want to delete it after the tests have been
    executed.
    So it makes sense having another function, which deletes the object (in this
    case a ``delete_user``-function) that can simply be called in ``afterAll``.
    In addition we decided to put an ``afterAll`` at the end of each test file
    which contains a ``console.log("<protractor suite name> ->
    <filename>.e2e.js")``.
    By doing so it is possible to track which test in which file is currently
    executed when running all tests.
  * In a bunch of openATTIC HTML files (see ``openattic/webui/app/templates``)
    you'll find css classes which are especially set for tests (those test
    classes are recognizable by the ``tc_``-term which stands for "test
    class"). This is very useful when protractor finds more than one element
    of something (i.e. "Add"-button) and you can specify the element by adding
    or just using this tc_class of the element you're looking for to the
    locator. This makes the needed element unique (i.e.:
    ``element(by.css('oadatatable .tc_add_btn')).click();``)
  * Tests should be readable and understandable for someone who is not familiar
    in detail with tests in order to make it easy to see what exactly the test
    does and to make it simple writing tests for contributors.
    Also, for someone who does not know what the software is capable of, having
    a look at the tests should help understanding the behavior of the
    application
  * Always navigate to the page which should be tested before each test to make
    sure that the page is in a "clean state".
    This can be done by putting the navigation part in a ``beforeEach`` function
    - which ensures that ``it`` sections do not depend on each other as well.
  * Make sure that written tests do work in the latest version of Chrome and
    Firefox
  * The name of folders/files should tell what the test is about (i.e. folder
    "user" contains "user_add.e2e.js")

Tips on how to write tests that also support Firefox
----------------------------------------------------

Let protractor only click on clickable elements, like ``a``, ``button`` or
``input``.

If you want to select an option element use the following command to make sure
that the item is selected (`issue #480
<https://github.com/angular/protractor/issues/480#issuecomment-122429984>`_)::

	browser.actions().sendKeys( protractor.Key.ENTER ).perform();


Debugging your tests
--------------------

To set a breakpoint use ``browser.pause()`` in your code.

After your test pauses, go to the terminal window where you started the test.

You can type ``c`` and hit enter to continue to the next command
or you can type ``repl`` to enter the interactive mode, here you can type
commands that will be executed in the test browser.

To continue the test execution press ``ctrl + c``.
