.. _developer_docs_index:

Developer Documentation
#######################

|oA| consists of a set of components built on different frameworks, which work
together to provide a comprehensive Ceph storage management platform.

This document describes the architecture and components of |oA| and provides
instructions on how to set up a development environment and work on the various
components included in the |oA| code base.

If you would like to contribute to the |oA| project, you need to prepare a
development environment first.

Follow the outlined steps to :ref:`developer_git_howto`.

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

  git
  vagrant
  setup_howto
  contribute
  contributing_guidelines
  architecture
  developer-documentation
  ui_customizing
  fe_taskqueue
  be_taskqueue
  dev_fe_unit_tests
  dev_e2e
  dev_gatling
  python_unittests
