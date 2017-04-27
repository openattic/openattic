.. _developer_contribute:

Contributing Code to |oA|
=========================

This is an introduction on how to contribute code or patches to the |oA|
project. If you intend to submit your code upstream, please also review and
consider the guidelines outlined in chapter
:ref:`developer_contributing_guidelines`.

Keeping Your Local Repository in Sync
-------------------------------------

If you have followed the instructions in :ref:`developer_git_howto`, you
should already have a local |oA| instance that is based on the current
master branch.

You should update your repository configuration so that you will always pull
from the upstream |oA| repository and push to your |oA| fork by default. This
ensures that your fork is always up to date, by tracking the upstream
development.

It is pretty common to name the upstream remote repository ``upstream`` and your
personal fork ``origin``.

If you've cloned your local repo from your personal fork already, it should
already be named ``origin`` - you can verify this with the following command::

    $ git remote -v
    origin	git@bitbucket.org:<username>/openattic.git (fetch)
    origin	git@bitbucket.org:<username>/openattic.git (push)

If the name differs, you can use ``git remote rename <old> <new>``.

Now add the upstream repository by running the following command::

    $ git remote add upstream ssh://git@bitbucket.org/openattic/openattic.git

Now you can keep your local repository in sync with the upstream repository by
running ``git fetch upstream``.

Using git+ssh behind a Proxy Server
-----------------------------------

If you want to use SSH behind a proxy you may use `corkscrew
<http://agroman.net/corkscrew/>`_. After the installation, append the
following two lines to your ``$HOME/.ssh/config`` file::

    Host bitbucket.org
        ProxyCommand corkscrew <proxy name or ip> <port number> %h %p

Now you can use SSH behind the proxy, because corkscrew now tunnels your SSH
connections through the proxy to bitbucket.org.

Working With Branches
---------------------

It is strongly recommended to separate changes required for a new feature or for
fixing a bug in a separate git branch. Please refer to the git documentation for
a `detailed introduction into working with branches
<https://www.git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell>`_.

If you intend to submit a patch to the upstream |oA| repository via a pull
request, please make sure to follow the
:ref:`developer_contributing_guidelines`.

To create a new feature branch, update your repository, change to the
``master`` branch and create your new branch on top of it, in which you
commit your feature changes::

    $ git fetch upstream
    $ git checkout master
    $ git pull upstream master
    $ git checkout -b <branchname>
    < Your code changes >
    $ git commit -a

To list your branches type the following (the current branch will be marked with
an asterisk)::

    $ git branch --list

To just see the current branch you are working with type::

    $ git rev-parse --abbrev-ref HEAD

After you are done with your changes, you can push them to your fork::

    $ git push origin

.. _submitting_pull_requests:

Submitting Pull Requests
------------------------

Now that your fork on BitBucket contains your changes in a separate branch, you
can create a pull-request on `Bitbucket <https://bitbucket.org>`_ to request an
inclusion of the changes you have made into the ``master`` branch of the
upstream |oA| repository.

To do this, go to your fork on `Bitbucket <https://bitbucket.org>`_ and click
``Create pull request`` in the left panel. On the next page, choose the branch
with your changes as source and the |oA| ``master`` branch as target.

Below the **Create pull request** button, first check out the **Diff** part if
there are any merge conflicts. If you have some, you have go back into your
branch and update it::

    $ git fetch upstream
    $ git rebase upstream/master
    <resolve conflicts, mark them as resolved using "git add"> 
    <test and review changes>
    $ git rebase --continue
    $ git push -f origin

After you have resolved the merge conflicts and pushed them into your fork,
retry submitting the pull-request. If you already created a pull request,
BitBucket will update it automatically.

After the pull-request was reviewed and accepted, your feature branch will be
merged into the main repository. You may delete your feature branch on your
local repository and BitBucket fork once it has been merged.