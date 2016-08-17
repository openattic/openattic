.. _developer_docs_index:

Developer Documentation
#######################

|oA| consists of a set of components built on different frameworks, which work
together to provide a comprehensive storage management platform.

This document describes the architecture and components of |oA| and provides
instructions on how to set up a development environment and work on the |oA|
code base.

When an application (e.g. the |oA| Web UI, a command line tool or an external
application), wants to perform an action, the following happens:

* The REST API receives a request in form of a function call, decides which
  host is responsible for answering the request, and forwards it to the core
  on that host.
* The :ref:`developer_docs_models` consists of two layers:

  * Django Models, the brains. They keep an eye on the whole system and decide
    what needs to be done.
  * File system layer: Decides which programs need to be called in order to
    implement the actions requested by the models, and calls those programs
    via the |oA| ``systemd`` background process (not to be confused with the
    `systemd System and Service Manager
    <http://www.freedesktop.org/wiki/Software/systemd/>`_).

* The |oA| `systemd` executes commands on the system and delivers the results.

If you would like to contribute to the |oA| project, you need to prepare a
development environment first.

Follow the outlined steps to :ref:`developer_hg_howto`.

Next, follow the instructions on :ref:`developer_vagrant_howto` or :ref:`developer_setup_howto`.
Then code away, implementing whatever changes you want to make.

If you're looking for inspiration or some easy development tasks to get started
with, we've created a list of
`low hanging fruit tasks <https://wiki.openattic.org/display/OP/Low+hanging+fruit+tasks>`_
that are limited in scope and should be fairly easy to tackle.

See :ref:`developer_contribute` for details on how to submit your changes to
the upstream developers. Follow the :ref:`developer_contributing_guidelines`
to make sure your patches will be accepted.

If your changes modify documented behaviour or implement new functionality,
the documentation should be updated as well. See
:ref:`developer_documentation` for instructions on how to update the
documentation.

.. toctree::
  :maxdepth: 2

  mercurial
  vagrant
  setup_howto
  contribute
  contributing_guidelines
  core
  developer-documentation
  dev_e2e
  dev_gatling
