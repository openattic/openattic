.. _developer_contributing_guidelines:

|oA| Contributing Guidelines
============================

Please see :ref:`developer_contribute` for details on the process of how to
contribute code changes.

The following recommendations should be considered when working on the |oA|
code base.

While adhering to these guidelines may sound more work in the first place,
following them has multiple benefits:

* It supports the collaboration with other developers and others involved in
  the product development life cycle (e.g. documentation, QA, release
  engineering).
* It makes the product development life cycle more reliable and reproducible.
* It makes it more transparent to the user what changes went into a build or
  release.

Some general recommendations for making changes and for documenting and
tracking them:

* New Python code should adhere to the `Style Guide for Python Code
  <https://www.python.org/dev/peps/pep-0008/>`_ (PEP 8) with the exception of
  using 100 instead of 80 characters per line. Use the ``flake8``
  tool to verify that your changes don't violate this style before committing
  your modifications. Also, please have a look at the `Django coding style guides
  <https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/>`_
  as a reference.

* Existing code can be refactored to adhere to PEP 8, if you feel like it.
  However, such style changes must be committed separately from other code
  modifications, to ease the reviewing of such pull requests.

* For JavaScript code, we use `ESLint <https://eslint.org/>`_ using the
  `eslint-loader <https://github.com/MoOx/eslint-loader/>`_ to perform
  automated syntax and style checks of the JavaScript code.  ESLint is
  configured to adhere to the official `AngularJS style guide
  <https://angular.io/guide/styleguide>`_.  Please consult this style guide for
  more details on the coding style and conventions.  The configuration files
  for these WebUI rules can be found in ``webui/.eslintrc.json`` and
  ``webui/webpack.eslintrc.json``. 

* Every bug fix or notable change made to a release branch must be accompanied
  by a `JIRA issue <https://tracker.openattic.org/>`_. The issue ID must be
  mentioned in the summary of the commit message and pull request in the
  following format: ``<summary> (OP-xxxx)``.

* Pull requests must be accompanied by a suggested ``CHANGELOG`` entry that
  documents the change.

* New features and other larger changes also require a related JIRA issue that
  provides detailed background information about the change.

* Code and the related changes to the documentation should be committed
  in the same change set, if possible. This way, both the code and
  documentation are changed at the same time.

* Write meaningful commit messages and pull request descriptions. Commit
  messages should include a detailed description of the change, including a
  reference to the related JIRA issue, if appropriate. "Fixed OP-xxx" is not a
  valid or useful commit message! For details on why this matters, see `The
  Science (or Art?) of Commit Messages
  <http://www.joinfu.com/2012/01/the-science-of-commit-messages/>`_ and `How to
  Write a Git Commit Message <http://chris.beams.io/posts/git-commit/>`_

* When resolving a JIRA issue as fixed, include the resulting git
  revision ID or add a link to the ChangeSet or related pull request on
  BitBucket for reference. This makes it easier to review the code changes
  that resulted from a bug report or feature request.

Documenting Your Changes
------------------------

Depending on what you have changed, your modifications should be clearly
described and documented. Basically, you have two different audiences that
have different expectations on how and where you document your changes:

* **Developers** that need to review and comment on your changes from an
  architectural and code quality point of view. They are primarily interested
  in the descriptions you put into the git commit messages and the
  description of your pull request, but will also review and comment on any
  other documentation you provide.
* **End users or administrators** that use |oA| and need to be aware of
  potential changes in behaviour, new features or important bug and security
  fixes. They primarily consult the official documentation, release notes and
  the ``CHANGELOG``.

Changes that should be user-visibly documented in the ``CHANGELOG``, release
notes or documentation include:

* Bug/security fixes on a release branch.
* User-visible changes or changes in behavior on a release branch. Make sure
  to review and update the documentation, if required.
* Major changes / new features. In addition to the ``CHANGELOG``, these must be
  described in the documentation as well. See :ref:`developer_documentation` for
  details on how to update the |oA| documentation.

Minor or "behind the scene" changes that have no user-visible impact or do not
cause changes in behavior/functionality (e.g. improvements to build scripts,
typo fixes, internal code refactoring) usually don't have to be documented in
the ``CHANGELOG`` or the release notes.

Trust your judgment or ask other developers if you're unsure if something
should be user-visibly documented or not.

Don't worry too much about the wording or formatting, the ``CHANGELOG`` and
Release Notes will be reviewed and improved before a final release build
anyway. It's much more important that we keep track of all notable changes
without someone having to trawl JIRA or the commit messages prior to a
release.

.. _developer_patchsign:

Signing Your Patch Contribution
-------------------------------

To improve tracking of who did what, we use the "sign-off" procedure
`introduced by the Linux kernel
<https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/Documentation/process/submitting-patches.rst>`_.
The sign-off is a simple line at the end of the explanation for the patch,
which certifies that you wrote it or otherwise have the right to pass it on as
an open-source patch.

The rules are pretty simple: if you can certify the following:

.. literalinclude:: developer-certificate-of-origin.txt

then you just add the following line below your commit message and pull
request saying::

  Signed-off-by: Random J Developer <random@developer.example.org>

using your **real name and email address**  (sorry, no pseudonyms or anonymous
contributions).

Using git, this can be performed by adding the option ``--signoff`` to your
commit command.

If you like, you can put extra tags at the end:

#.  ``Reported-by:`` is used to credit someone who found the bug that
    the patch attempts to fix.
#.  ``Acked-by:`` says that the person who is more familiar with the
    area the patch attempts to modify liked the patch.
#.  ``Reviewed-by:``, unlike the other tags, can only be offered by the
    reviewer and means that she is completely satisfied that the patch is
    ready for application. It is usually offered only after a detailed review.
#.  ``Tested-by:`` is used to indicate that the person applied the patch
    and found it to have the desired effect.

You can also create your own tag or use one that's in common usage
such as ``Thanks-to:``, ``Based-on-patch-by:``, or ``Mentored-by:``.

.. _merging_pull_requests:

Merging Pull Requests
---------------------

The following steps should be performed when you're reviewing and processing a
pull request on BitBucket:

#.  A developer fixes a bug or implements a new feature in a dedicated
    feature branch. If required, he documents the changes in the documentation
    (for end-users) and the git commit messages (including the related
    Jira issue ID and a ``Signed-off by:`` line as outlined in chapter
    :ref:`developer_patchsign`)
#.  The developer creates a new Pull Request on BitBucket as described in
    chapter :ref:`submitting_pull_requests`. The Pull Request description
    should include a detailed description of the change in a form suitable
    for performing a code review, summarizing the necessary changes. The
    description should also include a text suitable for inclusion into the
    ``CHANGELOG``, describing the change from an end-user perspective.
#.  After the pull request has been reviewed and approved, you perform the
    merge into the ``master`` branch using the BitBucket merge functionality.
#.  Use a "merge" commit, not a "squash" commit for merging pull requests via
    BitBucket.

Backport commits
----------------

The following steps should be performed when you want to backport a fix to a
stable release branch:

#.  Ensure that the commits you want to backport exists on master
    (original pull request is merged to master)
#.  Update your upstream repo:
    ``git fetch upstream``
#.  Create a branch from the stable release branch:
    ``git checkout -b OP-<issue_id>-backport upstream/2.x``
#.  Cherry pick the commits, using -x option:
    ``git cherry-pick -x <sha-1>``
#.  Adapt the CHANGELOG
#.  Run all tests
#.  Submit a pull request to the ``2.x`` stable release branch
    (title should be prefixed with "[2.x]")

Error Handling in Python
------------------------

A few notes about error handling in |oA|.

Good error handling is a key requirement in creating a good user experience
and providing a good API. In our opinion, providing good errors to users is a
blocker for releasing any non-beta releases of |oA|.

Assume all user input is bad. As we are using Django, we can make use
of Django's user input validation. For example, Django will validate model
objects when deserializing from JSON and before saving them into the
database. One way to achieve this is to add constraints to Django's
model field definitions, like ``unique=True`` to catch duplicate inserts.

In general, input validation is the best place to catch errors and generate
the best error messages. If feasible, generate errors as soon as possible.

Django REST framework has a default way of `serializing errors
<http://www.django-rest-framework.org/api-guide/exceptions/#exception-handling-in-rest-framework-views>`_.
We should use this standard when creating own exceptions. For example,
we should attach an error to a specific model field, if possible.

Our WebUI should show errors generated by the API to the user. Especially
field-related errors in wizards and dialogs or show non-intrusive notifications.

Handling exceptions in Python should be an exception. In general, we
should have few exception handlers in our project. Per default, propagate
errors to the API, as it will take care of all exceptions anyway. In general,
log the exception by adding ``logger.exception()`` with a description to the
handler.

In Python it is easier to `ask for forgiveness than permission (EAFP)
<https://docs.python.org/2/glossary.html#term-bdfl>`_. This common Python
coding style assumes the existence of valid keys or attributes and catches
exceptions if the assumption proves false. This clean and fast style is
characterized by the presence of many ``try`` and ``except`` statements. The
technique contrasts with the LBYL style common to many other languages such as C.

When calling system utilities or call external libraries, raise exceptions if
appropriate to inform the user of problems. For example, if mounting a
volume fails, raise an exception. From the `Zen Of Python
<https://www.python.org/dev/peps/pep-0020/>`_:

  Errors should never pass silently.
  Unless explicitly silenced.

Distinguish user errors from internal errors and programming errors. Using
different exception types will ease the task for the API layer and for the
user interface:

* Use ``NotImplementedError`` in abstract methods when they **require** derived classes
  to override the method. Have a look at the official `documentation
  <https://docs.python.org/2/library/exceptions.html#exceptions.NotImplementedError>`_.
* Use ``ValidationError`` in an input validation step. For example. Django is using
  ``ValidationErrors`` when deserializing input.
* In case a ``NotImplementedError`` is not appropriate, because it is intentional
  not to implement a method and a ``ValidationError`` is not appropriate, because
  you're not validating any input, you can use a ``NotSupportedError``. For example,
  if a file system does not support shrinking, you can use this exception here.
  They will be converted to a 400 status code in the API.
* Standard Python errors, like ``SystemError``, ``ValueError`` or ``KeyError``
  will end up as internal server errors in the API.
* Assert statements can help, if you want to protect functions from having bad
  side effects or return bad results.

In general, do not return error responses in the REST API. They will be
returned by the |oA| error handler ``exception.custom_handler``. Instead, raise
the appropriate exception.

In a Python function, in case of an error, try to raise an exception instead of
returning ``None``. Returning ``None`` in this case forces your caller to always
check for ``None`` values.

Database migrations
-------------------

Please follow the standard guidelines for adding database migration for Django 1.8+. Even, if you
changed a `NoDB` model that don't write any data into the database. This ensures a consistent table
schema for future Django upgrades.
