.. _developer_hg_howto:

Create Your own |oA| Mercurial Fork on BitBucket
------------------------------------------------

The |oA| source code is managed using the `Mercurial
<https://www.mercurial-scm.org/>`_ distributed source control management tool.
Mercurial offers you a full-fledged version control, where you can commit and
manage your source code locally and also exchange your modifications with
other developers by pushing and pulling change sets across repositories.

If you're new to Mercurial, take a look at the `Learn Mercurial
<https://www.mercurial-scm.org/learn>`_ web site. This will teach you the
basics of how to get started.

The |oA| source code repository is publicly hosted in a `Mercurial Repository
on BitBucket <https://bitbucket.org/openattic/openattic/>`_.

A "fork" is a remote Mercurial clone of a repository. Every |oA| developer
makes code modifications on a local copy (clone) of his fork before they are
merged into the main repository. See :ref:`developer_contribute` for
instructions on how to get your code contributions included in the |oA| main
repository.

It is possible to create a local clone of the |oA| repository by simply
running ``hg clone https://bitbucket.org/openattic/openattic``.

However, if you would like to collaborate with the |oA| developers, you should
consider creating a user account on BitBucket and create a "Fork".

Take a look at the `BitBucket Documentation
<https://confluence.atlassian.com/bitbucket/bitbucket-cloud-documentation-home-221448814.html>`_
for instructions on how to create a free BitBucket account. We require real
user names over pseudonyms when working with contributors.

Once you are logged into BitBucket, go to `the openATTIC main repository
<https://bitbucket.org/openattic/openattic>`_ and click **Fork** on the left
side under **ACTIONS**. Now you should have your own |oA| fork on BitBucket,
which will be used to create a local copy (clone). You can find your
repository's SSH or HTTPS URL in the top right corner of the repository
overview page. Use this URL with ``hg clone`` to create your local development
clone.
