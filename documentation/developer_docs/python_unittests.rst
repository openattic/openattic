Python Unit Tests
=================

This chapter describes the use of unit tests for Python. Python unit tests are much simpler than our
E2E or Gatling tests, as they only test the Python code without having external dependencies, thus
they are purely focused on the Python code.

Executing Tests
---------------

Keep in mind that in order to execute the tests, |oA| needs an execution environment with a database
connection.

Please navigate to the backend root folder and execute::

  $ ./manage.py test -t . -v 2

To generate a coverage analysis, you will have to install coverage::

  $ pip install coverage

Then, run the analysis::

  $ coverage run --source='.' manage.py test -t . -v 2

and generate a report with::

  $ coverage report

It's also possible to generate detailed HTML reports to identify uncovered code lines by running::

  $ coverage html

It will create the directory ``htmlcov`` containing ``index.html`` as a starting point.


Starting Only a Specific Test Suite
-----------------------------------

In order to run just a subset of the tests, append the backend module name like so::

  $ manage.py test <module-name> -t . -v 2

where ``<module-name>`` needs to be replaced with a module name, like ``ceph``.

Writing Tests
-------------

Every backend module contains a ``tests.py`` containing unit tests. Please add your new
unit test to this file.

We also make use of doctest. If your test would be an enhancement to the documentation and your
testing subject is easy to test, i.e. without mocking and side effects, consider to add this test to
the docstring and add or extend the "doctest boiler plate"::

  import doctest
  def load_tests(loader, tests, ignore):
      tests.addTests(doctest.DocTestSuite(<module containing the doctest>))
      return tests

Style Guide
-----------

Here are a few recommendations:

* Focus purely on Python. Hesitate to test anything else.
* Aim for keeping the testing coverage in percent for every Pull Request.
* Keep the tests fast: Don't add any sleep statements or long running tests, except if really
  necessary. Speed is important, as it keeps the code-test loop short.
* Use mock to reduce external dependencies, but try to reduce the amount of mock statements.
* Make sure your new tests work with all supported Django versions.
* Don't execute network requests, as they introduce dependencies to other services.
