.. _developer_docs_index:

Developer Documentation
#######################

|oA| consists of a set of components built on different frameworks, which work
together to provide a comprehensive storage management platform.

When an application (e.g. the |oA| Web UI, a command line tool or an external
application), wants to perform an action, the following happens:

* The REST API receives a request in form of a function call, decides which host is
  responsible for answering the request, and forwards it to the core on that host.
* The :ref:`developer_docs_models` consists of two layers:

  * Django Models, the brains. They keep an eye on the whole system and decide
    what needs to be done.
  * File system layer: Decides which programs need to be called in order to
    implement the actions requested by the models, and calls those programs
    via the |oA| ``systemd`` background process (not to be confused with the
    `systemd System and Service Manager
    <http://www.freedesktop.org/wiki/Software/systemd/>`_).

* The |oA| `systemd` executes commands on the system and delivers the results.

First of all, start off by :ref:`developer_setup_howto`. Then code away,
implementing whatever changes you want to make. See
:ref:`developer_contribute` for details on how to submit your changes to the
upstream developers. Follow the :ref:`developer_contributing_guidelines` to
make sure your patches will be accepted.

.. toctree::
   :maxdepth: 2

   setup_howto
   contribute
   contributing_guidelines
   core
   dev_e2e
   dev_gatling
