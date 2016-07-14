.. _developer_contribute:

Contributing Code to |oA|
=========================

This is an introduction on how to contribute code or patches to the |oA|
project. If you intend to submit your code upstream, please also review and
consider the guidelines outlined in chapter
:ref:`developer_contributing_guidelines`.

Keeping Your Local Repository in Sync
-------------------------------------

If you have followed the instructions in :ref:`developer_setup_howto`, you
should already have a local |oA| instance that is based on the current
development branch.

You should update your repository configuration so that you will always pull
from the main |oA| repository and push to your |oA| fork by default. This
ensures that your fork is always up to date, by tracking the upstream
development.

In your local clone, edit the Mercurial configuration file ``.hg/hgrc``. It
should contain the following three lines::

    [paths]
    default = https://hg@bitbucket.org/openattic/openattic
    default-push = https://hg@bitbucket.org/<Your user name>/openattic

The ``default-push`` location is the URL that you can obtain from your fork's
repository overview page on BitBucket.

If you want to push via SSH, you just have to modify your ``default-push``
URL::

    default-push = ssh://hg@bitbucket.org/<Your user name>/openattic

This requires uploading your public SSH key to BitBucket first. Check the
BitBucket documentation for details on how to accomplish this.

If you want to use SSH behind a proxy you may use `corkscrew
<http://agroman.net/corkscrew/>`_. After the installation, append the
following two lines to your ``$HOME/.ssh/config`` file::

    Host bitbucket.org
        ProxyCommand corkscrew <proxy name or ip> <port number> %h %p

Now you can use SSH behind the proxy, because corkscrew now tunnels your SSH
connections through the proxy to bitbucket.org.

Working With Branches
---------------------

It is strongly recommended to separate changes required for a new feature or
for fixing a bug in a separate Mercurial branch. Please refer to the Mercurial
documentation for a detailed introduction into working with branches.

If you intend to submit a patch to the upstream |oA| repository via a pull
request, please make sure to follow the
:ref:`developer_contributing_guidelines`.

To create a new feature branch update your repository, change to the
development branch and create your new branch on top of it, in which you
commit your feature changes::

    # hg pull
    # hg update development
    # hg branch <branchname>
    < Your code changes >
    # hg commit

To list your branches type::

    # hg branches

To see the current branch you are working with type::

    # hg branch

After you are done with your changes, you want to push them to your fork::

    # hg push

If you can't push them because a new remote branch would be created use::

    # hg push --new-branch

.. _submitting_pull_requests:

Submitting Pull Requests
------------------------

Now that your fork contains your local changes in a separate branch, you can
create a pull-request on `Bitbucket <https://bitbucket.org>`_ to request an
inclusion of the changes you have made into the ``development`` branch of the
main |oA| repository.

To do this, go to your fork on `Bitbucket <https://bitbucket.org>`_ and click
``Create pull request`` in the left panel. On the next page, choose the branch
with your changes as source and the main |oA| development branch as target.

Below the **Create pull request** button, first check out the **Diff** part if
there are any merge conflicts. If you have some, you have go back into your
branch and update it::

    # hg pull
    # hg merge development
    <test and review changes>
    # hg commit -m "Merged development"
    # hg push

After you have resolved the merge conflicts and pushed them into your fork,
retry submitting the pull-request. If you already created a pull request,
BitBucket will update it automatically.

After the pull-request was reviewed and accepted, your feature branch will be
merged into the main repository. The merged feature branch will then be
closed in the main |oA| repository by the maintainer.

Please do not close the branch yourself, because after pulling from the main
repository, you'll also receive a changeset which closes your local branch.

To push the merge and closing of your branch into your fork again you have to
run the following command::

    # hg pull -u
    # hg push

Collaborating With Other Developers
-----------------------------------

The distributed nature of Mercurial makes it possible to collaborate with
other developers on the same set of changes, by pulling and pushing change
sets between the personal forks of the |oA| repository.

To pull changes from another developer's branch, type the following::

    # hg pull <alias or fork URL> <branch name>

If you plan to contribute something to the branch you have to push your
changes to your fork. The other developer can pull the changes the other way
round, see hg command above.

To create and use an alias you have to edit your ``.hg/hgrc`` and add a new
alias beneath ``[paths]``::

    <alias name> = <fork clone URL>

---------------

The following images illustrate this concept:

.. figure:: workflow_bitbucket.png

  Workflow between the main |oA| repository and your fork.

.. figure:: workflow_collaboration.png

  A collaborative workflow between two forks.

.. figure:: workflow_branches.png

  The workflow with branches.

-------------------------

**To sum it up**

Work on a specific branch::

    # hg update <branch name>

Fetch new revisions from |oA|::

    # hg pull -u

Merge your branch to the latest revision::

    # hg pull -u
    # hg merge development

Create a new branch on top of the current working branch::

    # hg branch <branch name>

Lists all open branches::

    # hg branches

Show current working branch::

    # hg branch

Merges a branch into the current working branch::

    # hg merge <branch name>

Push your changes on your fork::

    # hg push

Does the above, but creates a new branch or deletes an old one::

    # hg push --new-branch
