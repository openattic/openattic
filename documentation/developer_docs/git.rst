.. _developer_git_howto:

Create Your own |oA| git Fork on BitBucket
------------------------------------------

The openATTIC source code is managed using the `git distributed version control
system <https://www.git-scm.com/>`_.

Git offers you a full-fledged version control, where you can commit and manage
your source code locally and also exchange your modifications with other
developers by pushing and pulling change sets across repositories.

If you're new to git, take a look at the `git documentation
<https://www.git-scm.com/documentation>`_ web site. This will teach you the
basics of how to get started.

The |oA| source code repository is publicly hosted in a `git Repository
on BitBucket <https://bitbucket.org/openattic/openattic/>`_.

A "fork" is a remote git clone of a repository. Every |oA| developer makes code
modifications on a local copy (clone) of his fork before they are merged into
the main repository via pull requests. See :ref:`developer_contribute` for
instructions on how to get your code contributions included in the |oA| main
repository.

The quickest way to create a local clone of the main |oA| git repository is to simply
run the following command:: 

    $ git clone https://bitbucket.org/openattic/openattic

However, if you would like to collaborate with the |oA| developers, you should
consider `creating a user account <https://bitbucket.org/account/signup/>`_ on
BitBucket and create a "Fork".  We require real user names over pseudonyms when
working with contributors.

Once you are logged into BitBucket, go to `the openATTIC main repository
<https://bitbucket.org/openattic/openattic>`_ and click **Fork** on the left
side under **ACTIONS**. Now you should have your own |oA| fork on BitBucket,
which will be used to create a local copy (clone). You can find your
repository's SSH or HTTPS URL in the top right corner of the repository
overview page. Use this URL with ``git clone`` to create your local development
clone.

Take a look at the `BitBucket Documentation
<https://confluence.atlassian.com/bitbucket/bitbucket-cloud-documentation-home-221448814.html>`_
for further instructions on how to use BitBucket and how to work with
repositories.

If you would like to contribute code to |oA|, please make sure to read
:ref:`developer_contribute` for instructions specfic to our project.