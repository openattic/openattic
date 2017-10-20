.. _dev_fe_unit_tests:

|oA| Web UI Tests - Unit Tests
==================================

|oA| Web UI has both **Unit** and **E2E** tests.
This section is related to **Unit tests**, if you are looking for **E2E tests**
documentation please refer to :ref:`dev_e2e`.

Unit tests are implemented in ``*.spec.js`` files, which must be in the
same directory as the file being tested::

  +-- oa-sample
  |   '-- oa-sample.service.js
  |   '-- oa-sample.service.specjs

Writing Unit Tests
------------------

Use "angular.mock.module" instead of "module" seen in most examples.
The reason behind that is the usage of "webpack". It has a assigned module
variable which is a constant this way it can't be overwritten by the import
of "angular-mocks". To be consistent call other mock methods via
"angular.mock".

Run Unit Tests
--------------

To run |oA| Web UI unit tests, you should guarantee that your dependencies are updated
(``$ npm install``), and perform the following command::

    $ npm test

If you are a developer and want to run the tests on each change automatically
use this command::

    $ npm run devTest

Coverage Report
---------------

After running the unit tests, an HTML coverage report will be generated into
``coverage`` directory.
To open this coverage report you should use a web browser, e.g.::

    $ firefox coverage/index.html

References
----------

For more information on the tools that are used by the Web UI unit tests, see:

* `Karma <http://karma-runner.github.io>`_
* `Jarmine <https://jasmine.github.io/>`_
