.. _developer_contributing_guidelines:

|oA| Contributing Guidelines
============================

Please see :ref:`developer_contribute` for details on the process of how to
contribute code changes.

The following recommendations should be considered when working on the |oA|
Code Base.

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
  <https://www.python.org/dev/peps/pep-0008/>`_ (PEP 8). Use the ``flake8``
  tool to verify that your changes don't violate this style before comitting
  your modifications.
* Existing code can be refactored to adhere to PEP 8, if you feel like it.
  However, such style changes must be committed separately from other code
  modifications, to ease the reviewing of such pull requests.
* For JavaScript code, we use `grunt-jscs <grunt-tasks.com/grunt-jscs/>`_  and
  `grunt-contrib-jshint <https://github.com/gruntjs/grunt-contrib-jshint>`_ to
  perform automated syntax and style checks of the JavaScript code. The
  configuration files for these WebUI tests can be found in file
  ``webui/.jshintrc`` and ``webui/.jscsrc``, please consult them for more
  details on the coding style and conventions.
* Every bug fix or notable change made to a release branch must be accompanied
  by a bug report (JIRA issue).
* New features and other larger changes also require a related JIRA issue that
  provides detailed background information about the change.
* Code and the related changes to the documentation should be committed
  in the same change set, if possible. This way, both the code and
  documentation are changed at the same time.
* Write meaningful commit messages. Commit messages should include a detailed
  description of the change, including a reference to the related JIRA issue,
  if appropriate. "Fixed OP-xxx" is not a valid or useful commit message! For
  details on why this matters, see `The Science (or Art?) of Commit Messages
  <http://www.joinfu.com/2012/01/the-science-of-commit-messages/>`_ and `How
  to Write a Git Commit Message <http://chris.beams.io/posts/git-commit/>`_
  (this applies to Mercurial as well).
* When resolving a JIRA issue as fixed, include the resulting Mercurial Change
  Set Revision ID or add a link to the ChangeSet or related pull request on
  BitBucket for reference. This makes it easier to review the code changes
  that resulted from a bug report or feature request.

.. _documenting_changes:

Documenting Your Changes
------------------------

Depending on what you have changed, your modifications should be clearly
described and documented. Basically, you have two different audiences that
have different expectations on how and where you document your changes:

* **Developers** that need to review and comment on your changes from an
  architectural and code quality point of view. They are primarily interested
  in the descriptions you put into the Mercurial commit messages and the
  description of your pull request, but will also review and comment on any
  other documentation you provide.
* **End users or administrators** that use |oA| and need to be aware of
  potential changes in behaviour, new features or important bug and security
  fixes. They primarily consult the official documentation, release notes and
  the ``CHANGELOG``.

.. note::
  Note that you should not update the ``CHANGELOG`` directly. Instead, add a
  note to your pull request that includes the text that should be added to the
  ``CHANGELOG`` by the developer that merges your pull request. See chapter
  :ref:`merging_pull_requests` for details.

Changes that should be user-visibly documented in the ``CHANGELOG``, release
notes or documentation include:

* Bug/security fixes on a release branch.
* User-visible changes or changes in behavior on a release branch. Make sure
  to review and update the documentation, if required.
* Major changes / new features. In addition to the ``CHANGELOG``, these must
  be described in the documentation as well.

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
<http://git.kernel.org/cgit/linux/kernel/git/torvalds/linux.git/tree/Documentation/SubmittingPatches>`_.
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

If you want to automate the task of adding that tag line, consider installing
the `signoff.py Mercurial hook
<https://bitbucket.org/snippets/LenzGr/aygXb/signoffpy-a-mercurial-hook-to>`_.

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
    (for end-users) and the Mercurial commit messages (including the related
    Jira issue ID and a ``Signed-off by:`` line as outlined in chapter
    :ref:`developer_patchsign`)
#.  The developer creates a new Pull Request on BitBucket as described in
    chapter :ref:`submitting_pull_requests`. The Pull Request description
    should include a detailed description of the change in a form suitable
    for performing a code review, summarizing the necessary changes. The
    description should also include a text suitable for inclusion into the
    ``CHANGELOG``, describing the change from an end-user perspective.
#.  After the pull request has been reviewed and approved, you perform the
    merge into the main development branch using the BitBucket Merge
    functionality.
#.  If the merge was successful, update the ``CHANGELOG`` in the
    ``development`` branch based on the description provided by the developer
    that submitted the pull request. This can be performed by using the
    built-in editor on BitBucket.
#.  Close the feature branch that this pull request has been merged from, by
    using the BitBucket web frontend.
